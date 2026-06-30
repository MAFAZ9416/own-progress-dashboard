import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import authService from '../services/authService'

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()

  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [focused, setFocused] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [generalError, setGeneralError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
    if (generalError) {
      setGeneralError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setGeneralError('')

    const fieldErrors = {}
    if (!form.password) {
      fieldErrors.password = 'Password is required.'
    } else if (form.password.length < 8) {
      fieldErrors.password = 'Password must be at least 8 characters.'
    }

    if (!form.confirmPassword) {
      fieldErrors.confirmPassword = 'Confirm password is required.'
    } else if (form.password !== form.confirmPassword) {
      fieldErrors.confirmPassword = 'Passwords do not match.'
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    setIsLoading(true)

    try {
      await authService.resetPassword({
        token,
        password: form.password,
        confirm_password: form.confirmPassword,
      })

      localStorage.setItem('logoutMessage', 'Password updated successfully.')
      navigate('/login', { replace: true })
    } catch (err) {
      console.error(err)
      if (err.response?.status === 400 && err.response?.data) {
        const backendErrors = {}
        const data = err.response.data
        if (data.token) {
          setGeneralError(Array.isArray(data.token) ? data.token[0] : data.token)
        } else if (data.non_field_errors) {
          setGeneralError(data.non_field_errors[0])
        } else {
          Object.keys(data).forEach(key => {
            backendErrors[key] = Array.isArray(data[key]) ? data[key][0] : data[key]
          })
          setErrors(backendErrors)
        }
      } else {
        setGeneralError('Something went wrong. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="grid-overlay" />

      <div className="auth-card">
        <div className="auth-brand">
          <img src="/logo.png" alt="Progressly" className="auth-brand-logo" draggable={false} />
        </div>

        <div className="auth-header">
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">Enter your new password below</p>
        </div>

        {generalError && (
          <div className="auth-alert auth-alert--error" role="alert">
            <svg viewBox="0 0 20 20" fill="currentColor" className="alert-icon">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* New Password */}
          <div className={`field-group ${focused === 'password' ? 'field-focused' : ''} ${errors.password ? 'field-error' : ''}`}>
            <label htmlFor="reset-password" className="field-label">New Password</label>
            <div className="field-wrapper">
              <span className="field-icon">
                <Lock size={16} />
              </span>
              <input
                id="reset-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                value={form.password}
                onChange={handleChange}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused('')}
                disabled={isLoading}
                className="field-input"
                required
              />
              <button
                type="button"
                className="field-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <div className="field-error-text">
                <AlertCircle size={14} />
                <span>{errors.password}</span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className={`field-group ${focused === 'confirmPassword' ? 'field-focused' : ''} ${errors.confirmPassword ? 'field-error' : ''}`}>
            <label htmlFor="reset-confirm-password" className="field-label">Confirm Password</label>
            <div className="field-wrapper">
              <span className="field-icon">
                <Lock size={16} />
              </span>
              <input
                id="reset-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={form.confirmPassword}
                onChange={handleChange}
                onFocus={() => setFocused('confirmPassword')}
                onBlur={() => setFocused('')}
                disabled={isLoading}
                className="field-input"
                required
              />
              <button
                type="button"
                className="field-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="-1"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <div className="field-error-text">
                <AlertCircle size={14} />
                <span>{errors.confirmPassword}</span>
              </div>
            )}
          </div>

          <button type="submit" className="auth-btn" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Resetting...</span>
              </>
            ) : (
              <span>Reset Password</span>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
