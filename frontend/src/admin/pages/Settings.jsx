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
  Settings2,
  Globe,
  HelpCircle
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import authService from '../../services/authService'
import './Settings.css'

export default function Settings() {
  const { user, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile') // 'profile', 'notifications', 'dashboard', 'reports', 'application'

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
    dashboard: {
      layout: 'default',
      period: 'month',
      compact_cards: false,
      auto_refresh: 'off',
      show_legend: true,
      show_grid: true,
      enable_animations: true,
      show_charts: true,
      landing_page: '/admin/dashboard',
      widgets: {
        stats_grid: true,
        charts: true,
        recent_users: true,
        recent_activity: true,
        system_health: true,
        database_overview: true,
        top_skills: true,
        latest_feedback: true,
        notifications: true,
        quick_actions: true
      }
    },
    reports: {
      format: 'csv',
      range: 'all',
      include_charts: true,
      include_metadata: true
    },
    application: {
      log_retention: '30_days',
      session_timeout: '60m'
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
            setPreferences(prev => {
              const incoming = latestProfile.preferences || {}
              const dash = incoming.dashboard || {}
              const dashWidgets = dash.widgets || {}
              const rep = incoming.reports || {}
              const app = incoming.application || {}

              return {
                schema_version: incoming.schema_version || 1,
                dashboard: {
                  layout: dash.layout || 'default',
                  period: dash.period || 'month',
                  compact_cards: dash.compact_cards ?? false,
                  auto_refresh: dash.auto_refresh || 'off',
                  show_legend: dash.show_legend ?? true,
                  show_grid: dash.show_grid ?? true,
                  enable_animations: dash.enable_animations ?? true,
                  show_charts: dash.show_charts ?? true,
                  landing_page: dash.landing_page || '/admin/dashboard',
                  widgets: {
                    stats_grid: dashWidgets.stats_grid ?? true,
                    charts: dashWidgets.charts ?? true,
                    recent_users: dashWidgets.recent_users ?? true,
                    recent_activity: dashWidgets.recent_activity ?? true,
                    system_health: dashWidgets.system_health ?? true,
                    database_overview: dashWidgets.database_overview ?? true,
                    top_skills: dashWidgets.top_skills ?? true,
                    latest_feedback: dashWidgets.latest_feedback ?? true,
                    notifications: dashWidgets.notifications ?? true,
                    quick_actions: dashWidgets.quick_actions ?? true
                  }
                },
                reports: {
                  format: rep.format || 'csv',
                  range: rep.range || 'all',
                  include_charts: rep.include_charts ?? true,
                  include_metadata: rep.include_metadata ?? true
                },
                application: {
                  log_retention: app.log_retention || '30_days',
                  session_timeout: app.session_timeout || '60m'
                }
              }
            })
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
            <p className="admin-settings-subtitle">Manage administrative profile, security credentials, and system settings</p>
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
          <span>Profile &amp; Security</span>
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
          <Sliders size={14} />
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
        
        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Details Card */}
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

            {/* Change Password Card */}
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
        )}

        {/* NOTIFICATIONS TAB */}
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

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="settings-card admin-glow-card">
            <div className="card-header">
              <Sliders className="card-header-icon" />
              <h2>Dashboard Preferences</h2>
            </div>
            <form onSubmit={handlePrefsSubmit} className="settings-form">
              
              <div className="form-group">
                <label>Default Timeframe Period</label>
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
                <label>Auto Refresh Interval</label>
                <select
                  value={preferences.dashboard.auto_refresh}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    dashboard: { ...preferences.dashboard, auto_refresh: e.target.value }
                  })}
                >
                  <option value="off">Disabled (Manual)</option>
                  <option value="30s">30 Seconds</option>
                  <option value="1m">1 Minute</option>
                  <option value="5m">5 Minutes</option>
                </select>
              </div>

              <div className="form-group">
                <label>Default Landing Page Path</label>
                <input
                  type="text"
                  required
                  value={preferences.dashboard.landing_page}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    dashboard: { ...preferences.dashboard, landing_page: e.target.value }
                  })}
                />
              </div>

              <div className="form-group checkbox-container-settings" style={{ marginBottom: '1.5rem' }}>
                <label className="checkbox-label-settings">
                  <input
                    type="checkbox"
                    checked={preferences.dashboard.compact_cards}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      dashboard: { ...preferences.dashboard, compact_cards: e.target.checked }
                    })}
                  />
                  <span>Compact Cards (reduce padding and statistics sizes)</span>
                </label>
              </div>

              <div className="form-group checkbox-container-settings" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem', color: 'var(--admin-text-primary)' }}>Chart Visual Controls</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label className="checkbox-label-settings">
                    <input
                      type="checkbox"
                      checked={preferences.dashboard.show_charts}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        dashboard: { ...preferences.dashboard, show_charts: e.target.checked }
                      })}
                    />
                    <span>Show Charts Section</span>
                  </label>
                  <label className="checkbox-label-settings">
                    <input
                      type="checkbox"
                      checked={preferences.dashboard.show_legend}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        dashboard: { ...preferences.dashboard, show_legend: e.target.checked }
                      })}
                    />
                    <span>Show Chart Legends</span>
                  </label>
                  <label className="checkbox-label-settings">
                    <input
                      type="checkbox"
                      checked={preferences.dashboard.show_grid}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        dashboard: { ...preferences.dashboard, show_grid: e.target.checked }
                      })}
                    />
                    <span>Show Background Grid Lines</span>
                  </label>
                  <label className="checkbox-label-settings">
                    <input
                      type="checkbox"
                      checked={preferences.dashboard.enable_animations}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        dashboard: { ...preferences.dashboard, enable_animations: e.target.checked }
                      })}
                    />
                    <span>Enable Chart Load Animations</span>
                  </label>
                </div>
              </div>

              <div className="form-group" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.65rem', color: 'var(--admin-text-primary)' }}>Visible Dashboard Widgets</label>
                <div className="checkbox-container-settings" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.65rem' }}>
                  <label className="checkbox-label-settings">
                    <input
                      type="checkbox"
                      checked={preferences.dashboard.widgets.stats_grid}
                      onChange={() => handleWidgetToggle('stats_grid')}
                    />
                    <span>Statistics Summary Grid</span>
                  </label>
                  <label className="checkbox-label-settings">
                    <input
                      type="checkbox"
                      checked={preferences.dashboard.widgets.charts}
                      onChange={() => handleWidgetToggle('charts')}
                    />
                    <span>Analytics Graphs Row</span>
                  </label>
                  <label className="checkbox-label-settings">
                    <input
                      type="checkbox"
                      checked={preferences.dashboard.widgets.recent_users}
                      onChange={() => handleWidgetToggle('recent_users')}
                    />
                    <span>Recent Users List</span>
                  </label>
                  <label className="checkbox-label-settings">
                    <input
                      type="checkbox"
                      checked={preferences.dashboard.widgets.recent_activity}
                      onChange={() => handleWidgetToggle('recent_activity')}
                    />
                    <span>Recent Activity Feed</span>
                  </label>
                  <label className="checkbox-label-settings">
                    <input
                      type="checkbox"
                      checked={preferences.dashboard.widgets.system_health}
                      onChange={() => handleWidgetToggle('system_health')}
                    />
                    <span>System Health Diagnostics</span>
                  </label>
                  <label className="checkbox-label-settings">
                    <input
                      type="checkbox"
                      checked={preferences.dashboard.widgets.database_overview}
                      onChange={() => handleWidgetToggle('database_overview')}
                    />
                    <span>Database Sizing Monitor</span>
                  </label>
                  <label className="checkbox-label-settings">
                    <input
                      type="checkbox"
                      checked={preferences.dashboard.widgets.top_skills}
                      onChange={() => handleWidgetToggle('top_skills')}
                    />
                    <span>Top Skills Progression</span>
                  </label>
                  <label className="checkbox-label-settings">
                    <input
                      type="checkbox"
                      checked={preferences.dashboard.widgets.latest_feedback}
                      onChange={() => handleWidgetToggle('latest_feedback')}
                    />
                    <span>Latest Feedback Logs</span>
                  </label>
                  <label className="checkbox-label-settings">
                    <input
                      type="checkbox"
                      checked={preferences.dashboard.widgets.notifications}
                      onChange={() => handleWidgetToggle('notifications')}
                    />
                    <span>Admin Notifications Digest</span>
                  </label>
                  <label className="checkbox-label-settings">
                    <input
                      type="checkbox"
                      checked={preferences.dashboard.widgets.quick_actions}
                      onChange={() => handleWidgetToggle('quick_actions')}
                    />
                    <span>Administrative Quick Actions</span>
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
                  <span>Dashboard preferences saved and updated immediately.</span>
                </div>
              )}

              <button type="submit" disabled={isSavingPrefs} className="settings-submit-btn">
                {isSavingPrefs ? 'Saving Settings...' : 'Save Dashboard Preferences'}
              </button>
            </form>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="settings-card admin-glow-card">
            <div className="card-header">
              <FileSpreadsheet className="card-header-icon" />
              <h2>Reports &amp; Exports Preferences</h2>
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
                <label>Default Export Timeframe Range</label>
                <select
                  value={preferences.reports.range}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    reports: { ...preferences.reports, range: e.target.value }
                  })}
                >
                  <option value="all">Complete Database (All time)</option>
                  <option value="7_days">Last 7 Calendar Days</option>
                  <option value="30_days">Last 30 Calendar Days</option>
                  <option value="1_year">Last 1 Calendar Year</option>
                </select>
              </div>

              <div className="form-group checkbox-container-settings">
                <label className="checkbox-label-settings">
                  <input
                    type="checkbox"
                    checked={preferences.reports.include_charts}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      reports: { ...preferences.reports, include_charts: e.target.checked }
                    })}
                  />
                  <span>Include analytical charts visualization reference in report bundle</span>
                </label>
              </div>

              <div className="form-group checkbox-container-settings">
                <label className="checkbox-label-settings">
                  <input
                    type="checkbox"
                    checked={preferences.reports.include_metadata}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      reports: { ...preferences.reports, include_metadata: e.target.checked }
                    })}
                  />
                  <span>Include schema, generation timestamps, and requestor metadata</span>
                </label>
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

        {/* APPLICATION TAB */}
        {activeTab === 'application' && (
          <div className="settings-card admin-glow-card">
            <div className="card-header">
              <Sun className="card-header-icon" />
              <h2>Application System Preferences</h2>
            </div>
            <form onSubmit={handlePrefsSubmit} className="settings-form">
              
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
                <label>Administrator Session Timeout</label>
                <select
                  value={preferences.application.session_timeout}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    application: { ...preferences.application, session_timeout: e.target.value }
                  })}
                >
                  <option value="15m">15 Minutes</option>
                  <option value="30m">30 Minutes</option>
                  <option value="60m">60 Minutes</option>
                  <option value="2h">2 Hours</option>
                  <option value="24h">24 Hours</option>
                </select>
              </div>

              {/* Maintenance Mode (Disabled, indicated as Unavailable) */}
              <div className="form-group checkbox-container-settings" style={{ opacity: 0.5, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
                <label className="checkbox-label-settings" style={{ cursor: 'not-allowed' }}>
                  <input
                    type="checkbox"
                    disabled
                    checked={false}
                    readOnly
                  />
                  <span>System Maintenance Mode</span>
                </label>
                <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600, display: 'block', marginTop: '0.2rem' }}>
                  Unavailable — Requires Backend Integration
                </span>
                <p className="pref-desc">Restrict platform access to system administrators and present a maintenance landing screen to public users.</p>
              </div>

              {/* Beta Features Toggle (Disabled, indicated as Unavailable) */}
              <div className="form-group checkbox-container-settings" style={{ opacity: 0.5 }}>
                <label className="checkbox-label-settings" style={{ cursor: 'not-allowed' }}>
                  <input
                    type="checkbox"
                    disabled
                    checked={false}
                    readOnly
                  />
                  <span>Enable Platform Beta Features Toggle</span>
                </label>
                <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600, display: 'block', marginTop: '0.2rem' }}>
                  Unavailable — Requires Backend Integration
                </span>
                <p className="pref-desc">Activate bleeding-edge visual components, widgets, and experimental database configurations.</p>
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
