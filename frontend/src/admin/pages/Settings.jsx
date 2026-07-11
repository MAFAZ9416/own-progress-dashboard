import React, { useState, useEffect } from 'react'
import { 
  Settings as SettingsIcon, 
  User, 
  Lock, 
  AlertCircle, 
  CheckCircle, 
  Globe, 
  Bell,
  Sliders,
  Layout,
  Sun,
  ShieldCheck 
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import authService from '../../services/authService'
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

  // Notifications
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  // Preferences (System & Charts)
  const [preferences, setPreferences] = useState({
    dashboard_period: 'month',
    chart_animation: true,
    report_format: 'csv',
    default_analytics_page: '/admin/dashboard',
    widget_visibility: {
      showHeatmap: true,
      showRecentActivity: true,
      showQuickTasks: true,
      showTopSkills: true,
    },
    system: {
      theme_fallback: 'dark',
      log_retention: '30_days',
    }
  })
  
  const [isSavingPrefs, setIsSavingPrefs] = useState(false)
  const [prefsSuccess, setPrefsSuccess] = useState(false)
  const [prefsError, setPrefsError] = useState(null)

  // Load profile data & preferences
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
          setNotificationsEnabled(latestProfile.notifications_enabled ?? true)
          if (latestProfile.preferences) {
            setPreferences(prev => ({
              ...prev,
              ...latestProfile.preferences,
              widget_visibility: {
                ...prev.widget_visibility,
                ...(latestProfile.preferences.widget_visibility || {})
              },
              system: {
                ...prev.system,
                ...(latestProfile.preferences.system || {})
              }
            }))
          }
        }
      } catch (err) {
        console.error('Failed to load latest profile info:', err)
        if (active) {
          setProfileForm({
            full_name: user?.full_name || '',
            bio: user?.bio || '',
            country: user?.country || ''
          })
          setNotificationsEnabled(user?.notifications_enabled ?? true)
        }
      }
    }

    loadProfileData()

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

  // Handle preferences update
  const handlePrefsSubmit = async (e) => {
    e.preventDefault()
    setIsSavingPrefs(true)
    setPrefsSuccess(false)
    setPrefsError(null)

    try {
      const updated = await authService.updateProfile({
        notifications_enabled: notificationsEnabled,
        preferences: preferences
      })
      updateUser(updated)
      setPrefsSuccess(true)
      setTimeout(() => setPrefsSuccess(false), 5000)
    } catch (err) {
      console.error('Failed to update preferences:', err)
      setPrefsError('Failed to save settings preferences.')
    } finally {
      setIsSavingPrefs(false)
    }
  }

  const handleWidgetToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      widget_visibility: {
        ...prev.widget_visibility,
        [key]: !prev.widget_visibility[key]
      }
    }))
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
            <p className="admin-settings-subtitle">Manage account details, security credentials, notification rules, and system dashboard layouts</p>
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

      {/* Preferences Row */}
      <div className="admin-settings-full-width-section">
        <div className="settings-card admin-glow-card">
          <div className="card-header">
            <Sliders className="card-header-icon" />
            <h2>Preferences & Dashboard Rules</h2>
          </div>
          <form onSubmit={handlePrefsSubmit} className="settings-form preferences-form-layout">
            
            <div className="preferences-grid">
              {/* Notifications Preferences */}
              <div className="pref-section">
                <h3><Bell size={14} className="pref-icon" /> Email Notifications</h3>
                <div className="form-group checkbox-container-settings">
                  <label className="checkbox-label-settings">
                    <input
                      type="checkbox"
                      checked={notificationsEnabled}
                      onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    />
                    <span>Enable transactional email notifications</span>
                  </label>
                  <p className="pref-desc">Receive automated backups status and learner reports via email.</p>
                </div>
              </div>

              {/* System Preferences */}
              <div className="pref-section">
                <h3><Sun size={14} className="pref-icon" /> System Preferences</h3>
                <div className="form-group">
                  <label>Fallback Interface Theme</label>
                  <select
                    value={preferences.system.theme_fallback}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      system: { ...preferences.system, theme_fallback: e.target.value }
                    })}
                  >
                    <option value="dark">Dark Theme (Default)</option>
                    <option value="light">Light Theme</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Database Log Retention</label>
                  <select
                    value={preferences.system.log_retention}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      system: { ...preferences.system, log_retention: e.target.value }
                    })}
                  >
                    <option value="30_days">30 Days</option>
                    <option value="60_days">60 Days</option>
                    <option value="90_days">90 Days</option>
                  </select>
                </div>
              </div>

              {/* Charts Preferences */}
              <div className="pref-section">
                <h3><Layout size={14} className="pref-icon" /> Charts & Dashboard preferences</h3>
                <div className="form-group">
                  <label>Default dashboard period</label>
                  <select
                    value={preferences.dashboard_period}
                    onChange={(e) => setPreferences({ ...preferences, dashboard_period: e.target.value })}
                  >
                    <option value="week">Weekly</option>
                    <option value="month">Monthly</option>
                    <option value="year">Yearly</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Chart animation</label>
                  <select
                    value={String(preferences.chart_animation)}
                    onChange={(e) => setPreferences({ ...preferences, chart_animation: e.target.value === 'true' })}
                  >
                    <option value="true">Animation Enabled (On)</option>
                    <option value="false">Animation Disabled (Off)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Default report format</label>
                  <select
                    value={preferences.report_format}
                    onChange={(e) => setPreferences({ ...preferences, report_format: e.target.value })}
                  >
                    <option value="csv">CSV Spreadsheet</option>
                    <option value="json">JSON File</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Default Analytics Landing Page</label>
                  <input
                    type="text"
                    value={preferences.default_analytics_page}
                    onChange={(e) => setPreferences({ ...preferences, default_analytics_page: e.target.value })}
                  />
                </div>
              </div>

              {/* Widget Visibility Preferences */}
              <div className="pref-section">
                <h3><Layout size={14} className="pref-icon" /> Widget Visibility Options</h3>
                
                <div className="form-group checkbox-container-settings">
                  <label className="checkbox-label-settings">
                    <input
                      type="checkbox"
                      checked={preferences.widget_visibility.showHeatmap}
                      onChange={() => handleWidgetToggle('showHeatmap')}
                    />
                    <span>Show Task Completion Heatmap</span>
                  </label>
                </div>

                <div className="form-group checkbox-container-settings">
                  <label className="checkbox-label-settings">
                    <input
                      type="checkbox"
                      checked={preferences.widget_visibility.showRecentActivity}
                      onChange={() => handleWidgetToggle('showRecentActivity')}
                    />
                    <span>Show Recent User Activity Stream</span>
                  </label>
                </div>

                <div className="form-group checkbox-container-settings">
                  <label className="checkbox-label-settings">
                    <input
                      type="checkbox"
                      checked={preferences.widget_visibility.showQuickTasks}
                      onChange={() => handleWidgetToggle('showQuickTasks')}
                    />
                    <span>Show Quick Tasks Action Hub</span>
                  </label>
                </div>

                <div className="form-group checkbox-container-settings">
                  <label className="checkbox-label-settings">
                    <input
                      type="checkbox"
                      checked={preferences.widget_visibility.showTopSkills}
                      onChange={() => handleWidgetToggle('showTopSkills')}
                    />
                    <span>Show Top Learning Skills Overview</span>
                  </label>
                </div>
              </div>
            </div>

            {prefsError && (
              <div className="alert-banner error">
                <AlertCircle className="banner-icon" />
                <span>{prefsError}</span>
              </div>
            )}

            {prefsSuccess && (
              <div className="alert-banner success">
                <CheckCircle className="banner-icon" />
                <span>Preferences updated and saved to server.</span>
              </div>
            )}

            <button type="submit" disabled={isSavingPrefs} className="settings-submit-btn select-all-action-btn">
              {isSavingPrefs ? 'Saving Preferences...' : 'Save Configuration Preferences'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
  )
}
