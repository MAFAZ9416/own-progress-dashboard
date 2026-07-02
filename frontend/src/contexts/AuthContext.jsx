import { createContext, useContext, useState, useCallback, useMemo } from 'react'

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

function readStoredAuth() {
  const accessToken = localStorage.getItem('accessToken')
  const refreshToken = localStorage.getItem('refreshToken')
  const userData = localStorage.getItem('user')

  if (accessToken && refreshToken && userData) {
    try {
      return {
        user: JSON.parse(userData),
        isAuthenticated: true,
      }
    } catch {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    }
  }

  return { user: null, isAuthenticated: false }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredAuth().user)
  const [isAuthenticated, setIsAuthenticated] = useState(() => readStoredAuth().isAuthenticated)
  const isLoading = false

  const login = useCallback((accessToken, refreshToken, userData) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  const updateUser = useCallback((updatedData) => {
    setUser((prev) => {
      const updated = {
        ...prev,
        ...updatedData,
      }
      localStorage.setItem('user', JSON.stringify(updated))
      return updated
    })
  }, [])

  const value = useMemo(
    () => ({ isAuthenticated, isLoading, user, login, logout, updateUser }),
    [isAuthenticated, isLoading, user, login, logout, updateUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** Hook — throws if used outside <AuthProvider> */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
