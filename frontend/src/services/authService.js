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
    const { data: tokens } = await apiClient.post('/token/', {
      email,
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
   * Body:   { full_name, email, password }
   * Returns { id, email, ... }
   *
   * Registration does NOT auto-login; the caller redirects to /login.
   *
   * @param {{ full_name: string, email: string, password: string }} payload
   * @returns {object} created user
   */
  register: async ({ full_name, email, password, password2 }) => {
    const { data } = await apiClient.post('/users/register/', {
      full_name,
      email,
      password,
      password2,
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
   * Change password for the authenticated user.
   *
   * PUT /api/users/change-password/
   * Body: { current_password, new_password, confirm_password }
   * Returns { message: "Password updated successfully." }
   */
  changePassword: async ({ current_password, new_password, confirm_password }) => {
    const { data } = await apiClient.put('/users/change-password/', {
      current_password,
      new_password,
      confirm_password,
    })
    return data
  },

  /**
   * Delete user account permanently.
   *
   * DELETE /api/users/delete-account/
   * Body: { confirm_text, password }
   * Returns { message: "Account deleted successfully." }
   */
  deleteAccount: async ({ confirm_text, password }) => {
    const { data } = await apiClient.delete('/users/delete-account/', {
      data: {
        confirm_text,
        password,
      }
    })
    return data
  },

  /**
   * Request password reset link.
   *
   * POST /api/users/forgot-password/
   * Body: { email }
   */
  forgotPassword: async (email) => {
    const { data } = await apiClient.post('/users/forgot-password/', { email })
    return data
  },

  /**
   * Reset password using token.
   *
   * POST /api/users/reset-password/
   * Body: { token, password, confirm_password }
   */
  resetPassword: async ({ token, password, confirm_password }) => {
    const { data } = await apiClient.post('/users/reset-password/', {
      token,
      password,
      confirm_password,
    })
    return data
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

