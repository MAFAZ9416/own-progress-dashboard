import axios from 'axios'

/**
 * Axios API Client
 *
 * Pre-configured instance that:
 *  - Points to the backend base URL (from env or fallback)
 *  - Attaches the JWT access token on every request via request interceptor
 *  - Handles 401 responses globally (clears both tokens → redirect to /login)
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
})

import { getCachedData, setCachedData } from '../utils/offlineDatabase'
import { enqueueMutation } from '../utils/offlineQueue'

// Map cache stores to corresponding endpoints
function getCacheStoreForUrl(url) {
  if (!url) return null
  const lowercaseUrl = url.toLowerCase()
  if (lowercaseUrl.includes('/admin/statistics') || lowercaseUrl.includes('/analytics/')) return 'dashboard'
  if (lowercaseUrl.includes('/users/profile')) return 'profile'
  if (lowercaseUrl.includes('/skills')) return 'skills'
  if (lowercaseUrl.includes('/tasks')) return 'tasks'
  if (lowercaseUrl.includes('/notifications')) return 'notifications'
  if (lowercaseUrl.includes('/achievements')) return 'achievements'
  if (lowercaseUrl.includes('/users/preferences') || lowercaseUrl.includes('/admin/preferences')) return 'settings'
  return null
}

/* ── Request interceptor: inject token & handle offline fallbacks ── */
apiClient.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Intercept requests when browser is offline
    if (!navigator.onLine) {
      if (config.method === 'get') {
        const storeName = getCacheStoreForUrl(config.url)
        if (storeName) {
          const cached = await getCachedData(storeName, config.url)
          if (cached) {
            console.log(`PWA: Serving cached fallback for ${config.url}`)
            return Promise.reject({
              config,
              response: {
                data: cached,
                status: 200,
                statusText: 'OK',
                headers: {},
                config
              },
              isCachedFallback: true
            })
          }
        }
      } else {
        // Enqueue mutation requests offline
        const url = config.url || ''
        const lowercaseUrl = url.toLowerCase()
        const isSensitive =
          lowercaseUrl.includes('/token') ||
          lowercaseUrl.includes('/users/login') ||
          lowercaseUrl.includes('/users/register') ||
          lowercaseUrl.includes('/users/logout') ||
          lowercaseUrl.includes('/users/change-password') ||
          lowercaseUrl.includes('/users/forgot-password') ||
          lowercaseUrl.includes('/users/reset-password')

        if (!isSensitive) {
          await enqueueMutation(config.url, config.method, config.data)
          return Promise.reject({
            config,
            response: {
              data: { message: 'Action queued offline successfully', offline: true },
              status: 200,
              statusText: 'OK',
              headers: {},
              config
            },
            isCachedFallback: true
          })
        }
      }
    }

    return config
  },
  (error) => Promise.reject(error),
)

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

/* ── Response interceptor: handle expired/invalid tokens globally ── */
apiClient.interceptors.response.use(
  (response) => {
    // Cache successful GET API responses in IndexedDB
    if (response.config?.method === 'get') {
      const storeName = getCacheStoreForUrl(response.config.url)
      if (storeName) {
        setCachedData(storeName, response.config.url, response.data)
        localStorage.setItem('last_api_sync_time', new Date().toISOString())
      }
    }
    return response
  },
  async (error) => {
    // Resolve mocked offline/cached fallback payloads transparently
    if (error && error.isCachedFallback) {
      return Promise.resolve(error.response)
    }

    const originalRequest = error.config

    // If it's a 401 response and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      const url = originalRequest.url || ''
      
      // Ignore refresh handling for login, register, refresh, google auth, forgot/reset/change password
      const isIgnored = 
        url.includes('/token/') ||
        url.includes('/token/refresh/') ||
        url.includes('/users/register/') ||
        url.includes('/users/google-login/') ||
        url.includes('/users/forgot-password/') ||
        url.includes('/users/reset-password/') ||
        url.includes('/users/change-password/')

      if (isIgnored) {
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return apiClient(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refresh = localStorage.getItem('refreshToken')
      if (!refresh) {
        isRefreshing = false
        // Clear session and redirect since we have no refresh token
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        delete apiClient.defaults.headers.common['Authorization']
        window.location.href = '/login'
        return Promise.reject(error)
      }

      return new Promise((resolve, reject) => {
        const apiBase = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'
        const cleanApiBase = apiBase.endsWith('/') ? apiBase : `${apiBase}/`
        
        axios.post(`${cleanApiBase}token/refresh/`, { refresh })
          .then(({ data }) => {
            localStorage.setItem('accessToken', data.access)
            if (data.refresh) {
              localStorage.setItem('refreshToken', data.refresh)
            }
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.access}`
            originalRequest.headers.Authorization = `Bearer ${data.access}`
            processQueue(null, data.access)
            resolve(apiClient(originalRequest))
          })
          .catch((err) => {
            // Only logout if the token refresh call itself fails (e.g. refresh token is invalid or expired)
            processQueue(err, null)
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('user')
            delete apiClient.defaults.headers.common['Authorization']
            window.location.href = '/login'
            reject(err)
          })
          .finally(() => {
            isRefreshing = false
          })
      })
    }

    // Network errors or other non-401 server errors do NOT trigger logout
    return Promise.reject(error)
  },
)

export const getMediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    if (path.includes('/media/media/')) {
      return path.replace('/media/media/', '/media/');
    }
    return path;
  }
  const apiBase = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api';
  const backendBase = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : (apiBase.endsWith('/api/') ? apiBase.slice(0, -5) : apiBase);
  const cleanBackendBase = backendBase.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  let finalUrl = `${cleanBackendBase}/${cleanPath}`;
  if (finalUrl.includes('/media/media/')) {
    finalUrl = finalUrl.replace('/media/media/', '/media/');
  }
  return finalUrl;
};

export default apiClient
