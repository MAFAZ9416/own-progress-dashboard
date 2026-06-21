import { apiClient } from '../api'

/**
 * authService
 *
 * Handles all auth-related API calls mapped to the Django backend:
 *
 *   POST /api/users/register/   → register a new user
 *   POST /api/token/            → obtain JWT access + refresh token (login)
 *   GET  /api/users/profile/    → fetch the authenticated user's profile
 */
const authService = {
  /**
   * Login — Django SimpleJWT token endpoint.
   *
   * POST /api/token/
   * Body:   { username, password }  ← Django expects 'username', not 'email'
   * Returns { access, refresh }
   *
   * After obtaining tokens we immediately fetch the user profile so the
   * AuthContext receives a full user object (not just a token pair).
   *
   * @param {{ username: string, password: string }} credentials
   * @returns {{ access: string, refresh: string, user: object }}
   */
  login: async ({ email, password }) => {
    // Django SimpleJWT defaults to 'username' field. We send email as username.
    const { data: tokens } = await apiClient.post('/token/', {
      username: email,
      password,
    })

    // Temporarily set the access token so the profile request is authenticated
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`

    const { data } = await apiClient.get('/users/profile/')
    // Backend wraps the payload in { profile: { … } }; unwrap so the
    // AuthContext stores a flat user object (id, username, email, …).
    const user = data.profile ?? data

    return { access: tokens.access, refresh: tokens.refresh, user }
  },

  /**
   * Register — create a new user account.
   *
   * POST /api/users/register/
   * Body:   { username, email, password }
   * Returns { id, username, email, ... }
   *
   * Registration does NOT auto-login; the caller redirects to /login.
   *
   * @param {{ username: string, email: string, password: string }} payload
   * @returns {object} created user
   */
  register: async ({ username, email, password }) => {
    const { data } = await apiClient.post('/users/register/', {
      username,
      email,
      password,
    })
    return data
  },

  /**
   * Fetch the authenticated user's profile.
   *
   * GET /api/users/profile/
   * Requires Authorization header (handled by apiClient interceptor).
   *
   * @returns {object} user profile
   */
  getProfile: async () => {
    const { data } = await apiClient.get('/users/profile/')
    return data.profile ?? data
  },

  /**
   * Logout — client-side only.
   * (No Django blacklist endpoint assumed; just clear local tokens.)
   */
  logout: () => {
    delete apiClient.defaults.headers.common['Authorization']
  },
}

export default authService
