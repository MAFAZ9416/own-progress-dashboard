import React, { useState, useEffect } from 'react'
import { 
  Settings as SettingsIcon, 
  User, 
  Lock, 
  History, 
  AlertCircle, 
  CheckCircle, 
  Globe, 
  Monitor, 
  Compass, 
  ShieldCheck 
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import authService from '../../services/authService'
import { apiClient } from '../../api'
import './Settings.css'

export default function Settings() {
  const { user, updateUser } = useAuth()

  // Profile forms
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    bio: '',
    country: ''
  })
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState(null)

  // Password forms
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState(null)

  // Security Login History
  const [loginHistory, setLoginHistory] = useState([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [historyError, setHistoryError] = useState(null)

  // Load profile data & login history
  useEffect(() => {
    let active = true
    
    const loadProfileData = async () => {
      try {
        const latestProfile = await authService.getProfile()
        if (active) {
          setProfileForm({
            full_name: latestProfile.full_name || '',
            bio: latestProfile.bio || '',
            country: latestProfile.country || ''
          })
        }
      } catch (err) {
        console.error('Failed to load latest profile info:', err)
        if (active) {
          setProfileForm({
            full_name: user?.full_name || '',
            bio: user?.bio || '',
            country: user?.country || ''
          })
        }
      }
    }

    const loadLoginHistory = async () => {
      setIsLoadingHistory(true)
      setHistoryError(null)
      try {
        const response = await apiClient.get('/users/login-history/')
        if (active) {
          setLoginHistory(response.data || [])
        }
      } catch (err) {
        console.error('Failed to fetch login history:', err)
        if (active) {
          setHistoryError('Failed to retrieve security history logs.')
        }
      } finally {
        if (active) {
          setIsLoadingHistory(false)
        }
      }
    }

    loadProfileData()
    loadLoginHistory()

    return () => {
      active = false
    }
  }, [user])

  // Handle profile update
  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setIsSavingProfile(true)
    setProfileSuccess(false)
    setProfileError(null)

    try {
      const updated = await authService.updateProfile({
        full_name: profileForm.full_name.trim(),
        bio: profileForm.bio.trim(),
        country: profileForm.country.trim()
      })
      updateUser(updated)
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 5000)
    } catch (err) {
      console.error('Failed to update profile details:', err)
      setProfileError('Failed to update profile changes.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  // Handle password change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New password fields do not match.')
      return
    }
    setIsChangingPassword(true)
    setPasswordSuccess(false)
    setPasswordError(null)

    try {
      await authService.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        confirm_password: passwordForm.confirm_password
      })
      setPasswordSuccess(true)
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
      setTimeout(() => setPasswordSuccess(false), 5000)
    } catch (err) {
      console.error('Failed to update password:', err)
      const details = err.response?.data
      if (details && typeof details === 'object') {
        const firstErrKey = Object.keys(details)[0]
        const firstErrMsg = Array.isArray(details[firstErrKey]) ? details[firstErrKey][0] : details[firstErrKey]
        setPasswordError(`${firstErrKey}: ${firstErrMsg}`)
      } else {
        setPasswordError(err.response?.data?.detail || 'Failed to update user credentials.')
      }
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="admin-settings-container">
      {/* Header section */}
      <div className="admin-settings-header">
        <div className="header-left">
          <div className="header-icon-wrapper">
            <SettingsIcon className="header-icon" />
          </div>
          <div>
            <h1 className="admin-settings-title">Admin Configuration Settings</h1>
            <p className="admin-settings-subtitle">Manage your account profile, change administrative credentials, and view system audits</p>
          </div>
        </div>
      </div>

      <div className="admin-settings-grid">
        {/* Profile Card */}
        <div className="settings-card admin-glow-card">
          <div className="card-header">
            <User className="card-header-icon" />
            <h2>Administrator Profile Details</h2>
          </div>
          <form onSubmit={handleProfileSubmit} className="settings-form">
            <div className="form-group">
              <label>Account Login Username (Email)</label>
              <input
                type="text"
                disabled
                className="input-disabled"
                value={user?.email || ''}
              />
              <span className="help-text">Email address handles authentication log credentials.</span>
            </div>

            <div className="form-group">
              <label>Full Administrator Name</label>
              <input
                type="text"
                required
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Administrator Bio</label>
              <textarea
                rows={3}
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Admin Location (Country)</label>
              <input
                type="text"
                value={profileForm.country}
                onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
              />
            </div>

            {profileError && (
              <div className="alert-banner error">
                <AlertCircle className="banner-icon" />
                <span>{profileError}</span>
              </div>
            )}

            {profileSuccess && (
              <div className="alert-banner success">
                <CheckCircle className="banner-icon" />
                <span>Profile info updated successfully.</span>
              </div>
            )}

            <button type="submit" disabled={isSavingProfile} className="settings-submit-btn">
              {isSavingProfile ? 'Saving Info...' : 'Update Profile Info'}
            </button>
          </form>
        </div>

        {/* Change Credentials Card */}
        <div className="settings-card admin-glow-card">
          <div className="card-header">
            <Lock className="card-header-icon" />
            <h2>Change Security Credentials</h2>
          </div>
          <form onSubmit={handlePasswordSubmit} className="settings-form">
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                required
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                required
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                required
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
              />
            </div>

            {passwordError && (
              <div className="alert-banner error">
                <AlertCircle className="banner-icon" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="alert-banner success">
                <CheckCircle className="banner-icon" />
                <span>Credentials changed successfully.</span>
              </div>
            )}

            <button type="submit" disabled={isChangingPassword} className="settings-submit-btn">
              {isChangingPassword ? 'Processing...' : 'Change Admin Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Security Login History Log */}
      <div className="settings-full-card admin-glow-card">
        <div className="card-header">
          <History className="card-header-icon" />
          <h2>Security Panel — Login Session History</h2>
        </div>

        {historyError && (
          <div className="alert-banner error margin-1">
            <AlertCircle className="banner-icon" />
            <span>{historyError}</span>
          </div>
        )}

        {isLoadingHistory ? (
          <div className="history-loading">
            <div className="spinner"></div>
            <p>Gathering authentication records...</p>
          </div>
        ) : loginHistory.length === 0 ? (
          <div className="history-empty">
            <ShieldCheck className="empty-icon" />
            <p>No logged login history logs exist.</p>
          </div>
        ) : (
          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Login Timestamp</th>
                  <th>IP Address</th>
                  <th>Web Browser</th>
                  <th>Platform/Device</th>
                  <th>Session Status</th>
                </tr>
              </thead>
              <tbody>
                {loginHistory.map((hist) => (
                  <tr key={hist.id}>
                    <td>{new Date(hist.created_at).toLocaleString()}</td>
                    <td>
                      <span className="ip-badge">{hist.ip_address || 'Localhost/Internal'}</span>
                    </td>
                    <td>
                      <div className="device-info-cell">
                        <Compass className="inline-icon" />
                        <span>{hist.browser || 'Unknown Browser'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="device-info-cell">
                        <Monitor className="inline-icon" />
                        <span>{hist.device || 'Unknown Device'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`session-badge ${hist.is_active ? 'active' : 'inactive'}`}>
                        {hist.is_active ? 'Active' : 'Closed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
