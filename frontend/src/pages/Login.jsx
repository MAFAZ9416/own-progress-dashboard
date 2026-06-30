import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import authService from '../services/authService'

export default function Login() {
  const [form, setForm]           = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [focused, setFocused]     = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    const msg = localStorage.getItem('logoutMessage')
    if (msg) {
      setSuccessMsg(msg)
      localStorage.removeItem('logoutMessage')
    }
  }, [])

  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleChange = (e) => {
    setError('')                                              // clear error on edit
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Please fill in all fields.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const { access, refresh, user } = await authService.login({
        email:    form.email,
        password: form.password,
      })

      // Persist tokens + user in context (and localStorage)
      login(access, refresh, user)

      navigate('/dashboard', { replace: true })
    } catch (err) {
      // Django returns 401 with { detail: '...' } for bad credentials
      const msg =
        err?.response?.data?.detail ??
        err?.response?.data?.non_field_errors?.[0] ??
        'Invalid email or password.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* ── Animated background orbs ── */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* ── Grid noise overlay ── */}
      <div className="grid-overlay" />

      {/* ── Card ── */}
      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <img src="/logo.png" alt="Progressly" className="auth-brand-logo" draggable={false} />
        </div>

        <div className="auth-header">
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to continue your journey</p>
        </div>

        {/* ── Success banner ── */}
        {successMsg && (
          <div className="auth-alert auth-alert--success" role="status">
            <svg viewBox="0 0 20 20" fill="currentColor" className="alert-icon">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {/* ── Error banner ── */}
        {error && (
          <div className="auth-alert auth-alert--error" role="alert">
            <svg viewBox="0 0 20 20" fill="currentColor" className="alert-icon">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form id="login-form" onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Email Address */}
          <div className={`field-group ${focused === 'email' ? 'field-focused' : ''}`}>
            <label htmlFor="login-email" className="field-label">Email Address</label>
            <div className="field-wrapper">
              <span className="field-icon">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
              </span>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Enter your email address"
                value={form.email}
                onChange={handleChange}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused('')}
                className="field-input"
              />
            </div>
          </div>

          {/* Password */}
          <div className={`field-group ${focused === 'password' ? 'field-focused' : ''}`}>
            <div className="field-label-row">
              <label htmlFor="login-password" className="field-label">Password</label>
              <Link to="/forgot-password" className="field-link">Forgot password?</Link>
            </div>
            <div className="field-wrapper">
              <span className="field-icon">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                </svg>
              </span>
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused('')}
                className="field-input"
              />
              <button
                type="button"
                id="login-toggle-password"
                className="toggle-pw"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd"/>
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            id="login-submit-btn"
            type="submit"
            className="auth-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="btn-spinner" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="8" />
                </svg>
                <span>Signing in…</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <svg className="btn-arrow" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span>Don't have an account?</span>
        </div>

        {/* Register link */}
        <Link to="/register" id="login-register-link" className="auth-switch-btn">
          Create an account
        </Link>
      </div>
    </div>
  )
}
