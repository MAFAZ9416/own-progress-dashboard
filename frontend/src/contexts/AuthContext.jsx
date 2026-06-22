import { createContext, useContext, useState, useEffect } from 'react'

/**
 * AuthContext
 *
 * Provides:
 *   isAuthenticated        – boolean
 *   isLoading              – boolean (true while hydrating from localStorage)
 *   user                   – user object or null
 *   login(access, refresh, user) – persist both tokens + user, update state
 *   logout()               – clear all tokens + state
 */
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]                       = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading]             = useState(true)

  // Hydrate auth state from localStorage on first render
  useEffect(() => {
    const accessToken  = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')
    const userData     = localStorage.getItem('user')

    if (accessToken && refreshToken && userData) {
      try {
        setUser(JSON.parse(userData))
        setIsAuthenticated(true)
      } catch {
        // Corrupted storage — wipe everything
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
      }
    }

    setIsLoading(false)
  }, [])

  /**
   * Call after a successful login API response.
   * Persists both JWT tokens and the user profile to localStorage,
   * then updates React state so the rest of the app reacts immediately.
   *
   * @param {string} accessToken
   * @param {string} refreshToken
   * @param {object} userData
   */
  const login = (accessToken, refreshToken, userData) => {
    localStorage.setItem('accessToken',  accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user',         JSON.stringify(userData))
    setUser(userData)
    setIsAuthenticated(true)
  }

  /**
   * Clear all auth state — called on explicit logout or 401 interception.
   */
  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setUser(null)
    setIsAuthenticated(false)
  }

  /**
   * Update user state and localStorage without re-logging in.
   * Merges existing user data with the provided newData.
   */
  const updateUser = (updatedData) => {
    setUser((prev) => {
      const updated = {
        ...prev,
        ...updatedData,
      }
      localStorage.setItem('user', JSON.stringify(updated))
      return updated
    })
  }

  const value = { isAuthenticated, isLoading, user, login, logout, updateUser }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** Hook — throws if used outside <AuthProvider> */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
