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

/* ── Request interceptor: inject access token from localStorage ── */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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
  (response) => response,
  async (error) => {
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
    return path;
  }
  const apiBase = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api';
  const backendBase = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : (apiBase.endsWith('/api/') ? apiBase.slice(0, -5) : apiBase);
  const cleanBackendBase = backendBase.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  return `${cleanBackendBase}/${cleanPath}`;
};

export default apiClient
