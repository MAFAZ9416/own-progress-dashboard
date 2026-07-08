import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useProfileStats } from '../hooks/useProfileStats'
import { useMediaQuery } from '../hooks/useMediaQuery'
import authService from '../services/authService'
import { User, Mail, Calendar, Brain, ClipboardList, CheckCircle, Clock, Flame, Star, BarChart, LogOut, PlusCircle, Target, FileText, Lock, Loader2, AlertCircle, X, Share2, Check } from 'lucide-react'
import EditProfileModal from '../components/profile/EditProfileModal'
import { getMediaUrl } from '../api'
import './Profile.css'

export default function Profile() {
  const { user, logout } = useAuth()
  const { summary, recent, isLoading } = useProfileStats()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [shareCopied, setShareCopied] = useState(false)

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const handleShareProfile = async () => {
    const slug = user?.public_slug
    if (!slug) return
    const url = `${window.location.origin}/p/${slug}`
    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      showToast('Profile link copied to clipboard!')
      setTimeout(() => setShareCopied(false), 2500)
    } catch {
      showToast('Copy failed — try again')
    }
  }

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState({})

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setIsChangingPassword(true)
    setPasswordErrors({})

    // Client-side validation
    const errors = {}
    if (!passwordData.current_password) {
      errors.current_password = 'Current password is required.'
    }
    if (!passwordData.new_password) {
      errors.new_password = 'New password is required.'
    } else if (passwordData.new_password.length < 8) {
      errors.new_password = 'Password must be at least 8 characters.'
    }
    if (!passwordData.confirm_password) {
      errors.confirm_password = 'Confirm password is required.'
    } else if (passwordData.new_password !== passwordData.confirm_password) {
      errors.confirm_password = 'Passwords do not match.'
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors)
      setIsChangingPassword(false)
      return
    }

    try {
      await authService.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        confirm_password: passwordData.confirm_password,
      })
      
      showToast('✓ Password updated successfully.')
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      })
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data) {
        const backendErrors = {}
        Object.keys(err.response.data).forEach(key => {
          backendErrors[key] = Array.isArray(err.response.data[key])
            ? err.response.data[key].join(' ')
            : err.response.data[key]
        })
        setPasswordErrors(backendErrors)
      } else {
        setPasswordErrors({
          current_password: err.response?.data?.current_password || '',
          new_password: err.response?.data?.new_password || '',
          confirm_password: err.response?.data?.confirm_password || '',
          general: err.response?.data?.detail || err.response?.data?.message || 'Failed to update password. Please try again.'
        })
      }
    } finally {
      setIsChangingPassword(false)
    }
  }

  const [deleteData, setDeleteData] = useState({
    confirm_text: '',
    password: '',
  })
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deleteErrors, setDeleteErrors] = useState({})
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const handleDeleteAccountChange = (e) => {
    const { name, value } = e.target
    setDeleteData(prev => ({ ...prev, [name]: value }))
    if (deleteErrors[name]) {
      setDeleteErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleDeleteAccountSubmit = async (e) => {
    e.preventDefault()
    setIsDeletingAccount(true)
    setDeleteErrors({})

    // Client-side validation
    const errors = {}
    if (!deleteData.confirm_text) {
      errors.confirm_text = 'Confirmation text is required.'
    } else if (deleteData.confirm_text !== 'DELETE') {
      errors.confirm_text = 'You must type DELETE to confirm.'
    }
    if (!deleteData.password) {
      errors.password = 'Password is required.'
    }

    if (Object.keys(errors).length > 0) {
      setDeleteErrors(errors)
      setIsDeletingAccount(false)
      return
    }

    try {
      await authService.deleteAccount({
        confirm_text: deleteData.confirm_text,
        password: deleteData.password,
      })

      localStorage.setItem('logoutMessage', 'Account deleted successfully.')
      logout()
      window.location.href = '/login'
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data) {
        const backendErrors = {}
        Object.keys(err.response.data).forEach(key => {
          backendErrors[key] = Array.isArray(err.response.data[key])
            ? err.response.data[key].join(' ')
            : err.response.data[key]
        })
        setDeleteErrors(backendErrors)
      } else {
        setDeleteErrors({
          confirm_text: err.response?.data?.confirm_text || '',
          password: err.response?.data?.password || '',
          general: err.response?.data?.detail || err.response?.data?.message || 'Failed to delete account. Please try again.'
        })
      }
    } finally {
      setIsDeletingAccount(false)
    }
  }
  
  const isMobile = useMediaQuery('(max-width: 767px)')
  const activityLimit = isMobile ? 3 : 5

  const displayName = user?.full_name ?? user?.first_name ?? 'User'
  const email = user?.email ?? 'No email provided'
  const initials = displayName?.[0]?.toUpperCase() ?? '?'
  
  const joinDate = user?.date_joined 
    ? new Date(user.date_joined).toLocaleDateString(
        "en-US",
        {
            month: "long",
            year: "numeric",
        }
      )
    : 'Unknown date'

  const totalTasks = summary?.total_tasks ?? 0
  const completedTasks = summary?.tasks_done ?? 0
  const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(0) : 0
  const profileCompletion = summary?.profile_completion ?? 0
  const recentAchievements = summary?.recent_achievements ?? []
  const profileSuggestions = summary?.profile_suggestions ?? []

  return (
    <div className="profile-page">
      {/* Hero Profile Card */}
      <div className="profile-hero">
        <div className="profile-hero-content">
          <div className="profile-avatar-container">
            {user?.avatar ? (
              <img 
                src={getMediaUrl(user.avatar)} 
                alt={displayName} 
                className="profile-avatar-img" 
              />
            ) : (
              <div className="profile-avatar">{initials}</div>
            )}
            <div className="profile-status-indicator"></div>
          </div>
          <div className="profile-hero-info">
            <h1 className="profile-username">{displayName}</h1>
            <p className="profile-email">{email}</p>
            {user?.bio && <p className="profile-bio">{user.bio}</p>}
            <p className="profile-member-since">
              <Calendar size={14} className="profile-icon" />
              Member since {joinDate}
            </p>
          </div>
          <button className="profile-edit-button" onClick={() => setIsModalOpen(true)}>
            <User size={14} /> Edit Profile
          </button>
          {user?.public_slug && (
            <button
              id="btn-share-profile"
              className="profile-edit-button"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}
              onClick={handleShareProfile}
            >
              {shareCopied ? <Check size={14} /> : <Share2 size={14} />}
              {shareCopied ? 'Copied!' : 'Share Profile'}
            </button>
          )}
        </div>
        <div className="profile-hero-wave"></div>
      </div>


      {/* Statistics Section */}
      <div className="profile-stats-grid">
        <div className="profile-stat-card">
          <div className="profile-stat-icon-wrapper type-primary">
            <Brain size={20} />
          </div>
          <div className="profile-stat-data">
            <span className="profile-stat-value">{isLoading ? '...' : (summary?.total_skills ?? 0)}</span>
            <span className="profile-stat-label">Total Skills</span>
          </div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-icon-wrapper type-secondary">
            <ClipboardList size={20} />
          </div>
          <div className="profile-stat-data">
            <span className="profile-stat-value">{isLoading ? '...' : totalTasks}</span>
            <span className="profile-stat-label">Total Tasks</span>
          </div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-icon-wrapper type-success">
            <CheckCircle size={20} />
          </div>
          <div className="profile-stat-data">
            <span className="profile-stat-value">{isLoading ? '...' : completedTasks}</span>
            <span className="profile-stat-label">Completed</span>
          </div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-icon-wrapper type-warning">
            <Clock size={20} />
          </div>
          <div className="profile-stat-data">
            <span className="profile-stat-value">{isLoading ? '...' : (totalTasks - completedTasks)}</span>
            <span className="profile-stat-label">Pending</span>
          </div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-icon-wrapper type-danger">
            <Flame size={20} />
          </div>
          <div className="profile-stat-data">
            <span className="profile-stat-value">{isLoading ? '...' : (summary?.current_streak ?? 0)} {summary?.current_streak === 1 ? 'Day' : 'Days'}</span>
            <span className="profile-stat-label">Current Streak</span>
          </div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-icon-wrapper type-primary">
            <Star size={20} />
          </div>
          <div className="profile-stat-data">
            <span className="profile-stat-value">{isLoading ? '...' : (summary?.longest_streak ?? 0)} {summary?.longest_streak === 1 ? 'Day' : 'Days'}</span>
            <span className="profile-stat-label">Best Streak</span>
          </div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-icon-wrapper type-secondary">
            <BarChart size={20} />
          </div>
          <div className="profile-stat-data">
            <span className="profile-stat-value">{isLoading ? '...' : `${completionRate}%`}</span>
            <span className="profile-stat-label">Completion Rate</span>
          </div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-icon-wrapper type-primary">
            <Target size={20} />
          </div>
          <div className="profile-stat-data">
            <span className="profile-stat-value">{isLoading ? '...' : `${profileCompletion}%`}</span>
            <span className="profile-stat-label">Profile Complete</span>
          </div>
        </div>
      </div>

      <div className="profile-main-grid">
        {/* Account Information Card */}
        <div className="profile-card profile-account">
          <h2 className="profile-card-title">
            <User size={18} /> Account Information
          </h2>
          <div className="profile-account-list">
            <div className="profile-account-item">
              <span className="profile-account-label"><User size={16} /> Name</span>
              <span className="profile-account-value">{displayName}</span>
            </div>
            <div className="profile-account-item">
              <span className="profile-account-label"><Mail size={16} /> Email</span>
              <span className="profile-account-value">{email}</span>
            </div>
            {user?.bio && (
              <div className="profile-account-item">
                <span className="profile-account-label"><FileText size={16} /> Bio</span>
                <span className="profile-account-value profile-account-bio">{user.bio}</span>
              </div>
            )}
            <div className="profile-account-item">
              <span className="profile-account-label"><Calendar size={16} /> Member Since</span>
              <span className="profile-account-value">{joinDate}</span>
            </div>
          </div>
        </div>

        <div className="profile-card profile-achievements">
          <h2 className="profile-card-title">
            <Star size={18} /> Achievements
          </h2>
          {isLoading ? (
            <p className="profile-activity-text">Loading...</p>
          ) : recentAchievements.length > 0 ? (
            <div className="profile-activity-timeline">
              {recentAchievements.slice(0, 4).map((achievement) => (
                <div key={achievement.id} className="profile-activity-item">
                  <div className="profile-activity-icon">{achievement.icon}</div>
                  <div className="profile-activity-content">
                    <p className="profile-activity-text">{achievement.name}</p>
                    <span className="profile-activity-time">{achievement.description}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="profile-activity-text">No achievements unlocked yet.</p>
          )}
        </div>

        <div className="profile-card profile-recommendations">
          <h2 className="profile-card-title">
            <Target size={18} /> Profile Suggestions
          </h2>
          {profileSuggestions.length > 0 ? (
            <ul className="profile-activity-timeline">
              {profileSuggestions.slice(0, 4).map((suggestion, index) => (
                <li key={index} className="profile-activity-item">
                  <div className="profile-activity-icon"><PlusCircle size={16} /></div>
                  <div className="profile-activity-content">
                    <p className="profile-activity-text">{suggestion}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="profile-activity-text">Your profile is in good shape.</p>
          )}
        </div>

        {/* Recent Activity Card */}
        <div className="profile-card profile-activity">
          <div className="profile-activity-header">
            <h2 className="profile-card-title">
              <BarChart size={18} /> Recent Activity
            </h2>
            <button className="profile-view-all">View all</button>
          </div>
          <div className="profile-activity-timeline">
            {isLoading ? (
              <p className="profile-activity-text">Loading...</p>
            ) : recent && recent.length > 0 ? (
              recent.slice(0, activityLimit).map((item, i) => (
                <div key={item.id ?? i} className="profile-activity-item">
                  <div className="profile-activity-icon">
                    {item.type === 'skill' ? <PlusCircle size={16} /> : <CheckCircle size={16} />}
                  </div>
                  <div className="profile-activity-content">
                    <p className="profile-activity-text">{item.text}</p>
                    <span className="profile-activity-time">{item.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="profile-activity-text">No recent activity yet.</p>
            )}
          </div>
        </div>

        {/* Change Password Card */}
        <div className="profile-card profile-change-password">
          <h2 className="profile-card-title">
            <Lock size={18} /> Change Password
          </h2>
          <form onSubmit={handlePasswordSubmit} className="profile-password-form">
            {passwordErrors.general && (
              <div className="profile-password-error-banner">
                <AlertCircle size={14} />
                <span>{passwordErrors.general}</span>
              </div>
            )}
            
            <div className="profile-password-field-group">
              <label className="profile-password-label">Current Password</label>
              <input
                type="password"
                name="current_password"
                className={`profile-password-input ${passwordErrors.current_password ? 'profile-password-input--error' : ''}`}
                value={passwordData.current_password}
                onChange={handlePasswordChange}
                placeholder="Enter current password"
                disabled={isChangingPassword}
              />
              {passwordErrors.current_password && (
                <div className="profile-password-field-error">
                  <AlertCircle size={12} />
                  <span>{passwordErrors.current_password}</span>
                </div>
              )}
            </div>

            <div className="profile-password-field-group">
              <label className="profile-password-label">New Password</label>
              <input
                type="password"
                name="new_password"
                className={`profile-password-input ${passwordErrors.new_password ? 'profile-password-input--error' : ''}`}
                value={passwordData.new_password}
                onChange={handlePasswordChange}
                placeholder="Enter new password (min. 8 characters)"
                disabled={isChangingPassword}
              />
              {passwordErrors.new_password && (
                <div className="profile-password-field-error">
                  <AlertCircle size={12} />
                  <span>{passwordErrors.new_password}</span>
                </div>
              )}
            </div>

            <div className="profile-password-field-group">
              <label className="profile-password-label">Confirm Password</label>
              <input
                type="password"
                name="confirm_password"
                className={`profile-password-input ${passwordErrors.confirm_password ? 'profile-password-input--error' : ''}`}
                value={passwordData.confirm_password}
                onChange={handlePasswordChange}
                placeholder="Confirm new password"
                disabled={isChangingPassword}
              />
              {passwordErrors.confirm_password && (
                <div className="profile-password-field-error">
                  <AlertCircle size={12} />
                  <span>{passwordErrors.confirm_password}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="profile-password-btn"
              disabled={isChangingPassword}
            >
              {isChangingPassword ? (
                <>
                  <Loader2 size={14} className="profile-password-spinner animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="profile-danger">
        <h2 className="profile-danger-title">Danger Zone</h2>
        <p className="profile-danger-subtitle">These actions are irreversible. Please be careful.</p>
        <button className="profile-logout-button" onClick={logout}>
          <LogOut size={16} /> Logout
        </button>

        {/* Delete Account Card */}
        <div className="profile-danger-card profile-delete-account">
          <h3 className="profile-danger-card-title">Delete Account</h3>
          <p className="profile-danger-card-warning" style={{ marginBottom: '1.25rem' }}>
            Once you delete your account, there is no going back. All your data will be permanently removed.
          </p>
          <button
            type="button"
            className="profile-delete-btn"
            style={{ width: 'auto', alignSelf: 'flex-start', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444' }}
            onClick={() => {
              setIsDeleteModalOpen(true)
              setDeleteData({ confirm_text: '', password: '' })
              setDeleteErrors({})
            }}
          >
            Delete Account...
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="ep-modal-overlay">
          <div className="ep-modal" style={{ maxWidth: '450px' }}>
            <div className="ep-modal-header">
              <h3 className="ep-modal-title" style={{ color: '#ef4444' }}>Delete Your Account</h3>
              <button 
                type="button" 
                className="ep-close-btn" 
                onClick={() => setIsDeleteModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleDeleteAccountSubmit} className="ep-form" style={{ marginTop: '1rem' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.875rem', borderRadius: '8px', color: '#fca5a5', fontSize: '0.875rem', marginBottom: '1.25rem', display: 'flex', gap: '0.5rem' }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '0.125rem' }} />
                <span>
                  <strong>Warning:</strong> This action is irreversible. All your recorded skills, tasks, daily habits, streaks, and analytics logs will be permanently deleted from Progressly.
                </span>
              </div>

              {deleteErrors.general && (
                <div className="profile-delete-error-banner" style={{ marginBottom: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '8px', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                  <AlertCircle size={14} />
                  <span>{deleteErrors.general}</span>
                </div>
              )}

              <div className="profile-delete-field-group" style={{ marginBottom: '1rem' }}>
                <label className="profile-delete-label" style={{ display: 'block', fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                  Type <span className="delete-keyword-highlight" style={{ color: '#ef4444', fontWeight: 'bold' }}>DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  name="confirm_text"
                  className={`profile-delete-input ${deleteErrors.confirm_text ? 'profile-delete-input--error' : ''}`}
                  value={deleteData.confirm_text}
                  onChange={handleDeleteAccountChange}
                  placeholder="Type DELETE"
                  disabled={isDeletingAccount}
                  style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '0.625rem 0.75rem', color: '#ffffff' }}
                />
                {deleteErrors.confirm_text && (
                  <div className="profile-delete-field-error" style={{ color: '#f87171', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.375rem' }}>
                    <AlertCircle size={12} />
                    <span>{deleteErrors.confirm_text}</span>
                  </div>
                )}
              </div>

              <div className="profile-delete-field-group" style={{ marginBottom: '1.5rem' }}>
                <label className="profile-delete-label" style={{ display: 'block', fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                  Enter Password
                </label>
                <input
                  type="password"
                  name="password"
                  className={`profile-delete-input ${deleteErrors.password ? 'profile-delete-input--error' : ''}`}
                  value={deleteData.password}
                  onChange={handleDeleteAccountChange}
                  placeholder="Enter password"
                  disabled={isDeletingAccount}
                  style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '0.625rem 0.75rem', color: '#ffffff' }}
                />
                {deleteErrors.password && (
                  <div className="profile-delete-field-error" style={{ color: '#f87171', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.375rem' }}>
                    <AlertCircle size={12} />
                    <span>{deleteErrors.password}</span>
                  </div>
                )}
              </div>

              <div className="ep-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  className="ep-btn-cancel" 
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeletingAccount}
                  style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="profile-delete-btn" 
                  disabled={isDeletingAccount}
                  style={{ background: '#ef4444', color: '#ffffff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {isDeletingAccount ? (
                    <>
                      <Loader2 size={14} className="profile-delete-spinner animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Permanently Delete</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <EditProfileModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={showToast} 
      />

      {toast && (
        <div className="profile-toast">
          {toast}
        </div>
      )}
    </div>
  )
}
