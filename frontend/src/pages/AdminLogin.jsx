import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import authService from '../services/authService'
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Fingerprint,
  KeyRound,
  AlertCircle,
} from 'lucide-react'
import './AdminLogin.css'

/**
 * AdminLogin
 *
 * Enterprise admin login page at /admin/login.
 * Reuses the existing authentication flow:
 *   1. authService.login() → POST /api/token/ + GET /api/users/profile/
 *   2. Checks user.is_staff || user.is_superuser
 *   3. If admin → stores tokens via AuthContext.login() → redirects to /dashboard
 *   4. If not admin → clears tokens, shows error, stays on page
 *
 * No backend changes. No new API endpoints.
 */
export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [focused, setFocused] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { login, logout } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setError('')
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
        email: form.email,
        password: form.password,
      })

      // Admin privilege check
      if (!user.is_staff && !user.is_superuser) {
        // Temporarily store then immediately clear to avoid stale state
        login(access, refresh, user)
        logout()
        setError('Insufficient administrator privileges.')
        return
      }

      // Admin verified — persist session and redirect
      login(access, refresh, user)
      navigate('/dashboard', { replace: true })
    } catch (err) {
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
    <div className="admin-login">
      {/* ══════════ LEFT HERO PANEL ══════════ */}
      <div className="admin-login__hero">
        <div className="admin-login__hero-grid" />
        <div className="admin-login__orb admin-login__orb--1" />
        <div className="admin-login__orb admin-login__orb--2" />
        <div className="admin-login__orb admin-login__orb--3" />

        <div className="admin-login__hero-content">
          <div className="admin-login__shield">
            <Shield strokeWidth={1.5} />
          </div>

          <h1 className="admin-login__hero-title">
            <span>Enterprise</span> Admin Portal
          </h1>

          <p className="admin-login__hero-subtitle">
            Secure command center for managing your Progressly platform.
            Authorized personnel only.
          </p>

          {/* Trust badges */}
          <div className="admin-login__badges">
            <div className="admin-login__badge">
              <ShieldCheck className="admin-login__badge-icon" />
              <span className="admin-login__badge-text">SOC 2 Compliant</span>
            </div>
            <div className="admin-login__badge">
              <Fingerprint className="admin-login__badge-icon" />
              <span className="admin-login__badge-text">GDPR Ready</span>
            </div>
            <div className="admin-login__badge">
              <KeyRound className="admin-login__badge-icon" />
              <span className="admin-login__badge-text">256-bit SSL</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ RIGHT LOGIN PANEL ══════════ */}
      <div className="admin-login__panel">
        <div className="admin-login__card">
          {/* Brand */}
          <div className="admin-login__card-brand">
            <img
              src="/logo.png"
              alt="Progressly"
              className="admin-login__card-logo"
              draggable={false}
            />
          </div>

          {/* Header */}
          <div className="admin-login__card-header">
            <h2 className="admin-login__card-title">Admin Sign In</h2>
            <p className="admin-login__card-subtitle">
              Access the management console
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="admin-login__alert" role="alert">
              <AlertCircle className="admin-login__alert-icon" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form
            id="admin-login-form"
            onSubmit={handleSubmit}
            className="admin-login__form"
            noValidate
          >
            {/* Email field */}
            <div
              className={`admin-login__field ${
                focused === 'email' ? 'admin-login__field--focused' : ''
              }`}
            >
              <label htmlFor="admin-login-email" className="admin-login__label">
                Email Address
              </label>
              <div className="admin-login__input-wrap">
                <span className="admin-login__input-icon">
                  <Mail />
                </span>
                <input
                  id="admin-login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="admin@progressly.com"
                  value={form.email}
                  onChange={handleChange}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused('')}
                  className="admin-login__input"
                />
              </div>
            </div>

            {/* Password field */}
            <div
              className={`admin-login__field ${
                focused === 'password' ? 'admin-login__field--focused' : ''
              }`}
            >
              <label
                htmlFor="admin-login-password"
                className="admin-login__label"
              >
                Password
              </label>
              <div className="admin-login__input-wrap">
                <span className="admin-login__input-icon">
                  <Lock />
                </span>
                <input
                  id="admin-login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused('')}
                  className="admin-login__input"
                />
                <button
                  type="button"
                  id="admin-login-toggle-password"
                  className="admin-login__toggle-pw"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="admin-login-submit-btn"
              type="submit"
              className="admin-login__submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="btn-spinner" viewBox="0 0 24 24" fill="none">
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray="32"
                      strokeDashoffset="8"
                    />
                  </svg>
                  <span>Authenticating…</span>
                </>
              ) : (
                <>
                  <span>Access Portal</span>
                  <ArrowRight className="admin-login__submit-arrow" />
                </>
              )}
            </button>
          </form>

          {/* Security footer */}
          <div className="admin-login__security">
            <Lock className="admin-login__security-icon" />
            <span className="admin-login__security-text">
              Protected by 256-bit SSL encryption
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
