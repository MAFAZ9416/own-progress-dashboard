import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import authService from '../services/authService'
import { Eye, EyeOff, ShieldAlert, Lock, Mail, Loader2 } from 'lucide-react'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const { access, refresh, user } = await authService.login({ email, password })

      if (user.is_staff || user.is_superuser) {
        setSuccess(true)
        // Store remember me preference if needed, or simply log in
        login(access, refresh, user)
        setTimeout(() => {
          navigate('/admin', { replace: true })
        }, 800)
      } else {
        // Log out immediately as they are not staff
        authService.logout()
        setError('Access denied. Administrator privileges required.')
      }
    } catch (err) {
      const msg =
        err?.response?.data?.detail ??
        err?.response?.data?.non_field_errors?.[0] ??
        'Invalid admin credentials. Please try again.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center relative px-4 overflow-hidden font-sans">
      {/* Background Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid Noise Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md bg-[#111827]/60 border border-white/5 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <img src="/static/email/logo.png" alt="Progressly" className="h-10 w-auto object-contain" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Progressly Enterprise</h2>
          <p className="text-xs text-slate-400 mt-1">Admin Management Portal</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-rose-400">
            <ShieldAlert size={16} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Banner */}
        {success && (
          <div className="mb-6 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-400">
            <Loader2 size={16} className="animate-spin mt-0.5 flex-shrink-0" />
            <span>Authenticating Admin Session...</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Email field */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Mail size={14} />
              </span>
              <input
                type="email"
                required
                placeholder="admin@progressly.com"
                value={email}
                onChange={(e) => { setError(''); setEmail(e.target.value); }}
                className="w-full bg-[#070B14]/80 border border-white/5 hover:border-white/10 focus:border-purple-500/40 rounded-xl pl-10 pr-3.5 py-3 text-xs text-slate-100 outline-none transition-all placeholder-slate-600"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Password</label>
              <Link to="/forgot-password" className="text-[10px] text-purple-400 hover:text-purple-300 font-medium">Forgot password?</Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock size={14} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setError(''); setPassword(e.target.value); }}
                className="w-full bg-[#070B14]/80 border border-white/5 hover:border-white/10 focus:border-purple-500/40 rounded-xl pl-10 pr-10 py-3 text-xs text-slate-100 outline-none transition-all placeholder-slate-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-white/5 bg-[#070B14]/80 text-purple-600 focus:ring-purple-500 focus:ring-offset-[#070B14]"
              />
              <span>Remember Me</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || success}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-purple-900/25 hover:shadow-purple-900/40"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

      </div>
    </div>
  )
}
