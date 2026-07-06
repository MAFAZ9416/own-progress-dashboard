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

/* ── Response interceptor: handle expired/invalid tokens globally ── */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear ALL auth state and redirect to login
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      delete apiClient.defaults.headers.common['Authorization']
      window.location.href = '/login'
    }
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
