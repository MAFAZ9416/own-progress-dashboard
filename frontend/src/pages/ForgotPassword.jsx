import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Loader2 } from 'lucide-react'
import authService from '../services/authService'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [focused, setFocused] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      setError('Email address is required.')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccessMsg('')

    try {
      const res = await authService.forgotPassword(email)
      setSuccessMsg(res.message || 'If this email exists, reset instructions were sent.')
      setEmail('')
    } catch (err) {
      console.error(err)
      const msg = err.response?.data?.email ??
                  err.response?.data?.detail ??
                  'Something went wrong. Please try again.'
      setError(Array.isArray(msg) ? msg[0] : msg)
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
          <h1 className="auth-title">Forgot Password</h1>
          <p className="auth-subtitle">Enter your email and we'll send you a password reset link</p>
        </div>

        {successMsg && (
          <div className="auth-alert auth-alert--success" role="status">
            <svg viewBox="0 0 20 20" fill="currentColor" className="alert-icon">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="auth-alert auth-alert--error" role="alert">
            <svg viewBox="0 0 20 20" fill="currentColor" className="alert-icon">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className={`field-group ${focused ? 'field-focused' : ''}`}>
            <label htmlFor="forgot-email" className="field-label">Email Address</label>
            <div className="field-wrapper">
              <span className="field-icon">
                <Mail size={16} />
              </span>
              <input
                id="forgot-email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                disabled={isLoading}
                className="field-input"
                required
              />
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Sending link...</span>
              </>
            ) : (
              <span>Send Reset Link</span>
            )}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
          <Link to="/login" className="auth-link" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#a78bfa', fontSize: '14px', fontWeight: '500' }}>
            <ArrowLeft size={14} style={{ marginRight: '6px' }} />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
