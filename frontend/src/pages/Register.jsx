import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import authService from '../services/authService'
import { useAuth } from '../contexts/AuthContext'
import { GoogleLogin } from '@react-oauth/google'

export default function Register() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const [focused, setFocused]           = useState('')
  const [isLoading, setIsLoading]       = useState(false)
  const [error, setError]               = useState('')       // generic / non-field error
  const [fieldErrors, setFieldErrors]   = useState({})       // per-field errors from Django
  const [success, setSuccess]           = useState(false)

  const navigate = useNavigate()
  const { login } = useAuth()

  const handleGoogleSuccess = async (credential) => {
    setIsLoading(true)
    setError('')
    try {
      const { access, refresh, user } = await authService.googleLogin(credential)
      login(access, refresh, user)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Google signup failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const passwordMatch =
    form.confirmPassword.length > 0 && form.password === form.confirmPassword

  const passwordMismatch =
    form.confirmPassword.length > 0 && form.password !== form.confirmPassword

  const handleChange = (e) => {
    setError('')
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: undefined }))
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsLoading(true)
    setError('')
    setFieldErrors({})

    try {
      const payload = {
        full_name: form.full_name,
        email:    form.email,
        password: form.password,
        password2: form.confirmPassword,
      }
      console.log("PAYLOAD:", payload)
      await authService.register(payload)

      setSuccess(true)

      // Redirect to login after a brief success moment
      setTimeout(() => navigate('/login', { replace: true }), 1500)
    } catch (err) {
      console.log("API ERROR RESPONSE:", err?.response?.data)
      const data = err?.response?.data

      if (data && typeof data === 'object') {
        // Django returns per-field arrays: { username: [...], email: [...], password: [...] }
        const { full_name, email, password, non_field_errors, detail, ...rest } = data

        const perField = {}
        if (full_name)         perField.full_name = full_name[0]
        if (email)             perField.email    = email[0]
        if (password)          perField.password = password[0]
        // Catch any other field errors
        Object.entries(rest).forEach(([k, v]) => {
          perField[k] = Array.isArray(v) ? v[0] : v
        })

        if (Object.keys(perField).length > 0) {
          setFieldErrors(perField)
        }
        
        if (non_field_errors || detail || Object.keys(perField).length === 0) {
          setError(
            non_field_errors?.[0] ??
            detail ??
            (Object.keys(perField).length === 0 ? 'Registration failed. Please try again.' : '')
          )
        }
      } else {
        setError('Registration failed. Please check your connection.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page register-page-only">
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
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Start tracking your progress today</p>
        </div>

        {/* ── Success toast ── */}
        {success && (
          <div className="auth-alert auth-alert--success" role="status">
            <svg viewBox="0 0 20 20" fill="currentColor" className="alert-icon">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Account created successfully.</span>
          </div>
        )}

        {/* ── Generic error banner ── */}
        {error && !success && (
          <div className="auth-alert auth-alert--error" role="alert">
            <svg viewBox="0 0 20 20" fill="currentColor" className="alert-icon">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form id="register-form" onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Full Name */}
          <div className={`field-group ${focused === 'full_name' ? 'field-focused' : ''} ${fieldErrors.full_name ? 'field-error' : ''}`}>
            <label htmlFor="register-full-name" className="field-label">Full Name</label>
            <div className="field-wrapper">
              <span className="field-icon">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                </svg>
              </span>
              <input
                id="register-full-name"
                name="full_name"
                type="text"
                required
                placeholder="Enter your full name"
                value={form.full_name}
                onChange={handleChange}
                onFocus={() => setFocused('full_name')}
                onBlur={() => setFocused('')}
                className="field-input"
              />
            </div>
            {fieldErrors.full_name && (
              <p className="field-error-msg">{fieldErrors.full_name}</p>
            )}
          </div>

          {/* Email */}
          <div className={`field-group ${focused === 'email' ? 'field-focused' : ''} ${fieldErrors.email ? 'field-error' : ''}`}>
            <label htmlFor="register-email" className="field-label">Email address</label>
            <div className="field-wrapper">
              <span className="field-icon">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
              </span>
              <input
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="your@email.com"
                value={form.email}
                onChange={handleChange}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused('')}
                className="field-input"
              />
            </div>
            {fieldErrors.email && (
              <p className="field-error-msg">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className={`field-group ${focused === 'password' ? 'field-focused' : ''} ${fieldErrors.password ? 'field-error' : ''}`}>
            <label htmlFor="register-password" className="field-label">Password</label>
            <div className="field-wrapper">
              <span className="field-icon">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                </svg>
              </span>
              <input
                id="register-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
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
                id="register-toggle-password"
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

            {/* Password strength indicator */}
            {form.password.length > 0 && (
              <div className="pw-strength">
                <div className={`pw-bar ${form.password.length >= 8 ? 'pw-bar--good' : 'pw-bar--weak'}`} />
                <div className={`pw-bar ${form.password.length >= 10 ? 'pw-bar--good' : 'pw-bar--empty'}`} />
                <div className={`pw-bar ${form.password.length >= 12 && /[^a-zA-Z0-9]/.test(form.password) ? 'pw-bar--strong' : 'pw-bar--empty'}`} />
                <span className="pw-label">
                  {form.password.length < 8
                    ? 'Too short'
                    : form.password.length < 10
                    ? 'Weak'
                    : form.password.length < 12
                    ? 'Good'
                    : 'Strong'}
                </span>
              </div>
            )}
            {fieldErrors.password && (
              <p className="field-error-msg">{fieldErrors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className={`field-group ${focused === 'confirmPassword' ? 'field-focused' : ''} ${passwordMismatch ? 'field-error' : ''} ${passwordMatch ? 'field-success' : ''}`}>
            <label htmlFor="register-confirm" className="field-label">Confirm password</label>
            <div className="field-wrapper">
              <span className="field-icon">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              </span>
              <input
                id="register-confirm"
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                required
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={handleChange}
                onFocus={() => setFocused('confirmPassword')}
                onBlur={() => setFocused('')}
                className="field-input"
              />
              <button
                type="button"
                id="register-toggle-confirm"
                className="toggle-pw"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? (
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

              {/* Inline match status icon */}
              {form.confirmPassword.length > 0 && (
                <span className={`match-icon ${passwordMatch ? 'match-icon--ok' : 'match-icon--err'}`}>
                  {passwordMatch ? (
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                  )}
                </span>
              )}
            </div>
            {passwordMismatch && (
              <p className="field-error-msg">Passwords do not match</p>
            )}
            {fieldErrors.password2 && !passwordMismatch && (
              <p className="field-error-msg">{fieldErrors.password2}</p>
            )}
          </div>

          {/* Submit */}
          <button
            id="register-submit-btn"
            type="submit"
            className="auth-btn"
            disabled={passwordMismatch || isLoading || success}
          >
            {isLoading ? (
              <>
                <svg className="btn-spinner" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="8" />
                </svg>
                <span>Creating account…</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <svg className="btn-arrow" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="google-auth-btn-wrap" style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={credentialResponse => {
              handleGoogleSuccess(credentialResponse.credential)
            }}
            onError={() => {
              setError('Google signup failed.')
            }}
            text="signup_with"
            theme="filled_blue"
            size="large"
            width="328"
          />
        </div>

        {/* Divider */}
        <div className="auth-divider">
          <span>Already have an account?</span>
        </div>

        {/* Login link */}
        <Link to="/login" id="register-login-link" className="auth-switch-btn">
          Sign in instead
        </Link>
      </div>
    </div>
  )
}
