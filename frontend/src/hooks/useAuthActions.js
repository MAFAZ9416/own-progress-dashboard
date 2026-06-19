import { useAuth } from '../contexts/AuthContext'

/**
 * useAuthActions
 *
 * Convenience hook that wraps authService calls with AuthContext state updates.
 * Keeps login/register logic out of page components.
 *
 * Usage:
 *   const { login, register, logout, isLoading, error } = useAuthActions()
 */
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services'

export function useAuthActions() {
  const { login: setAuth, logout: clearAuth } = useAuth()
  const navigate                              = useNavigate()
  const [isLoading, setLoading]               = useState(false)
  const [error, setError]                     = useState(null)

  const login = useCallback(async (credentials) => {
    setLoading(true)
    setError(null)
    try {
      const { accessToken, user } = await authService.login(credentials)
      setAuth(accessToken, user)
      navigate('/dashboard')
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }, [setAuth, navigate])

  const register = useCallback(async (payload) => {
    setLoading(true)
    setError(null)
    try {
      const { accessToken, user } = await authService.register(payload)
      setAuth(accessToken, user)
      navigate('/dashboard')
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Registration failed')
    } finally {
      setLoading(false)
    }
  }, [setAuth, navigate])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      // Ignore server error on logout — still clear local state
    } finally {
      clearAuth()
      navigate('/login')
    }
  }, [clearAuth, navigate])

  return { login, register, logout, isLoading, error }
}
