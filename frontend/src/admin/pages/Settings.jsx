import React, { useState, useEffect } from 'react'
import { 
  Settings as SettingsIcon, 
  User, 
  Lock, 
  AlertCircle, 
  CheckCircle, 
  Bell,
  Sliders,
  Layout,
  Sun,
  FileSpreadsheet,
  Settings2
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import authService from '../../services/authService'
import './Settings.css'

export default function Settings() {
  const { user, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile') // 'profile', 'security', 'notifications', 'dashboard', 'reports', 'application'

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

  // Structured Preferences JSON (categorized and versioned)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [preferences, setPreferences] = useState({
    schema_version: 1,
    notifications: {
      frequency: 'immediate',
    },
    dashboard: {
      period: 'month',
      animations: true,
      widgets: {
        users: true,
        skills: true,
        analytics: true,
        reports: true,
        health: true,
      }
    },
    reports: {
      format: 'csv',
      landing_page: '/admin/dashboard',
      auto_frequency: 'monthly',
    },
    application: {
      theme: 'dark',
      log_retention: '30_days',
      auto_refresh: 'off',
      datetime_format: 'YYYY-MM-DD HH:mm:ss',
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
          if (latestProfile.preferences && latestProfile.preferences.schema_version) {
            setPreferences(prev => ({
              ...prev,
              ...latestProfile.preferences,
              notifications: {
                ...prev.notifications,
                ...(latestProfile.preferences.notifications || {})
              },
              dashboard: {
                ...prev.dashboard,
                ...(latestProfile.preferences.dashboard || {}),
                widgets: {
                  ...prev.dashboard.widgets,
                  ...(latestProfile.preferences.dashboard?.widgets || {})
                }
              },
              reports: {
                ...prev.reports,
                ...(latestProfile.preferences.reports || {})
              },
              application: {
                ...prev.application,
                ...(latestProfile.preferences.application || {})
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
      dashboard: {
        ...prev.dashboard,
        widgets: {
          ...prev.dashboard.widgets,
          [key]: !prev.dashboard.widgets[key]
        }
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
            <p className="admin-settings-subtitle">Manage administrative profile, change credentials, and configure dashboard widgets</p>
          </div>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="admin-settings-tabs-container admin-glow-card">
        <button 
          onClick={() => setActiveTab('profile')} 
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
        >
          <User size={14} />
          <span>Profile</span>
        </button>
        <button 
          onClick={() => setActiveTab('security')} 
          className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
        >
          <Lock size={14} />
          <span>Security</span>
        </button>
        <button 
          onClick={() => setActiveTab('notifications')} 
          className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
        >
          <Bell size={14} />
          <span>Notifications</span>
        </button>
        <button 
          onClick={() => setActiveTab('dashboard')} 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
        >
          <Layout size={14} />
          <span>Dashboard</span>
        </button>
        <button 
          onClick={() => setActiveTab('reports')} 
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
        >
          <FileSpreadsheet size={14} />
          <span>Reports</span>
        </button>
        <button 
          onClick={() => setActiveTab('application')} 
          className={`tab-btn ${activeTab === 'application' ? 'active' : ''}`}
        >
          <Settings2 size={14} />
          <span>Application</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="admin-settings-panel-wrapper">
        {activeTab === 'profile' && (
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
        )}

        {activeTab === 'security' && (
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
        )}

        {activeTab === 'notifications' && (
          <div className="settings-card admin-glow-card">
            <div className="card-header">
              <Bell className="card-header-icon" />
              <h2>Notification Preferences</h2>
            </div>
            <form onSubmit={handlePrefsSubmit} className="settings-form">
              <div className="form-group checkbox-container-settings">
                <label className="checkbox-label-settings">
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  />
                  <span>Enable transactional email notifications</span>
                </label>
                <p className="pref-desc">Receive automated notifications digest and platform alerts via email.</p>
              </div>

              <div className="form-group">
                <label>Notification Alert Frequency</label>
                <select
                  value={preferences.notifications.frequency}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    notifications: { ...preferences.notifications, frequency: e.target.value }
                  })}
                >
                  <option value="immediate">Immediate Alerts</option>
                  <option value="daily">Daily Digest Summary</option>
                  <option value="weekly">Weekly Compilation</option>
                </select>
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
                  <span>Notification settings updated.</span>
                </div>
              )}

              <button type="submit" disabled={isSavingPrefs} className="settings-submit-btn">
                {isSavingPrefs ? 'Saving Preferences...' : 'Save Notification Preferences'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="settings-card admin-glow-card">
            <div className="card-header">
              <Sliders className="card-header-icon" />
              <h2>Dashboard Preferences</h2>
            </div>
            <form onSubmit={handlePrefsSubmit} className="settings-form">
              <div className="form-group">
                <label>Default Dashboard Timeframe Period</label>
                <select
                  value={preferences.dashboard.period}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    dashboard: { ...preferences.dashboard, period: e.target.value }
                  })}
                >
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                </select>
              </div>

              <div className="form-group">
                <label>Chart Animations Toggles</label>
                <select
                  value={String(preferences.dashboard.animations)}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    dashboard: { ...preferences.dashboard, animations: e.target.value === 'true' }
                  })}
                >
                  <option value="true">Animation Enabled (ON)</option>
                  <option value="false">Animation Disabled (OFF)</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ marginBottom: '0.25rem', display: 'block' }}>Visible Dashboard Widgets</label>
                <div className="checkbox-container-settings" style={{ gap: '0.65rem' }}>
                  <label className="checkbox-label-settings">
                    <input
                      type="checkbox"
                      checked={preferences.dashboard.widgets.users}
                      onChange={() => handleWidgetToggle('users')}
                    />
                    <span>Users Metrics Panel</span>
                  </label>
                  <label className="checkbox-label-settings">
                    <input
                      type="checkbox"
                      checked={preferences.dashboard.widgets.skills}
                      onChange={() => handleWidgetToggle('skills')}
                    />
                    <span>Skills Progression Hub</span>
                  </label>
                  <label className="checkbox-label-settings">
                    <input
                      type="checkbox"
                      checked={preferences.dashboard.widgets.analytics}
                      onChange={() => handleWidgetToggle('analytics')}
                    />
                    <span>Analytics Graph Center</span>
                  </label>
                  <label className="checkbox-label-settings">
                    <input
                      type="checkbox"
                      checked={preferences.dashboard.widgets.reports}
                      onChange={() => handleWidgetToggle('reports')}
                    />
                    <span>Generated Reports Registry</span>
                  </label>
                  <label className="checkbox-label-settings">
                    <input
                      type="checkbox"
                      checked={preferences.dashboard.widgets.health}
                      onChange={() => handleWidgetToggle('health')}
                    />
                    <span>System Health Diagnostics</span>
                  </label>
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
                  <span>Dashboard widgets preferences saved.</span>
                </div>
              )}

              <button type="submit" disabled={isSavingPrefs} className="settings-submit-btn">
                {isSavingPrefs ? 'Saving Settings...' : 'Save Dashboard Preferences'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="settings-card admin-glow-card">
            <div className="card-header">
              <FileSpreadsheet className="card-header-icon" />
              <h2>Reports & Exports Preferences</h2>
            </div>
            <form onSubmit={handlePrefsSubmit} className="settings-form">
              <div className="form-group">
                <label>Default Export Format File</label>
                <select
                  value={preferences.reports.format}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    reports: { ...preferences.reports, format: e.target.value }
                  })}
                >
                  <option value="csv">CSV Spreadsheet File</option>
                  <option value="json">JSON Structured Schema</option>
                </select>
              </div>

              <div className="form-group">
                <label>Default Analytics Landing Page</label>
                <input
                  type="text"
                  required
                  value={preferences.reports.landing_page}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    reports: { ...preferences.reports, landing_page: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label>Auto-Export Frequency Schedule</label>
                <select
                  value={preferences.reports.auto_frequency}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    reports: { ...preferences.reports, auto_frequency: e.target.value }
                  })}
                >
                  <option value="weekly">Weekly Snapshot</option>
                  <option value="monthly">Monthly Snapshot</option>
                  <option value="quarterly">Quarterly Snapshot</option>
                </select>
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
                  <span>Reports settings updated successfully.</span>
                </div>
              )}

              <button type="submit" disabled={isSavingPrefs} className="settings-submit-btn">
                {isSavingPrefs ? 'Saving Options...' : 'Save Reports Preferences'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'application' && (
          <div className="settings-card admin-glow-card">
            <div className="card-header">
              <Sun className="card-header-icon" />
              <h2>Application System Preferences</h2>
            </div>
            <form onSubmit={handlePrefsSubmit} className="settings-form">
              <div className="form-group">
                <label>Fallback Interface Theme Mode</label>
                <select
                  value={preferences.application.theme}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    application: { ...preferences.application, theme: e.target.value }
                  })}
                >
                  <option value="dark">Dark Theme Interface</option>
                  <option value="light">Light Theme Interface</option>
                </select>
              </div>

              <div className="form-group">
                <label>Database Log Retention Span</label>
                <select
                  value={preferences.application.log_retention}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    application: { ...preferences.application, log_retention: e.target.value }
                  })}
                >
                  <option value="30_days">30 Calendar Days</option>
                  <option value="60_days">60 Calendar Days</option>
                  <option value="90_days">90 Calendar Days</option>
                </select>
              </div>

              <div className="form-group">
                <label>Widgets Auto-Refresh Frequency</label>
                <select
                  value={preferences.application.auto_refresh}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    application: { ...preferences.application, auto_refresh: e.target.value }
                  })}
                >
                  <option value="off">Disabled (Manual Refresh)</option>
                  <option value="30s">30 Seconds Polling Loop</option>
                  <option value="1m">1 Minute Polling Loop</option>
                  <option value="5m">5 Minutes Polling Loop</option>
                </select>
              </div>

              <div className="form-group">
                <label>Default Date/Time Representation format</label>
                <input
                  type="text"
                  required
                  placeholder="YYYY-MM-DD HH:mm:ss"
                  value={preferences.application.datetime_format}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    application: { ...preferences.application, datetime_format: e.target.value }
                  })}
                />
                <span className="help-text">Input placeholder layout e.g. DD/MM/YYYY, YYYY-MM-DD.</span>
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
                  <span>System application rules saved.</span>
                </div>
              )}

              <button type="submit" disabled={isSavingPrefs} className="settings-submit-btn">
                {isSavingPrefs ? 'Saving Rules...' : 'Save Application Preferences'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
