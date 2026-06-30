import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Monitor, Eye, Bell, User, Info, Check, ExternalLink, ChevronRight, Mail, MessageSquare, Loader2 } from 'lucide-react'
import feedbackService from '../services/feedbackService'
import './Settings.css'

export default function Settings() {
  const { user } = useAuth()

  // 1. Dashboard Preferences State (Default all enabled)
  const [dbPreferences, setDbPreferences] = useState({
    showHeatmap: localStorage.getItem('showHeatmap') !== 'false',
    showRecentActivity: localStorage.getItem('showRecentActivity') !== 'false',
    showQuickTasks: localStorage.getItem('showQuickTasks') !== 'false',
    showTopSkills: localStorage.getItem('showTopSkills') !== 'false',
  })

  // 2. Notification Preferences State (Default all enabled)
  const [notifPreferences, setNotifPreferences] = useState({
    taskReminders: localStorage.getItem('taskReminders') !== 'false',
    completionNotifications: localStorage.getItem('completionNotifications') !== 'false',
    achievementNotifications: localStorage.getItem('achievementNotifications') !== 'false',
  })

  // Toggle preferences and update localStorage
  const handleDbPrefToggle = (key) => {
    const nextVal = !dbPreferences[key]
    setDbPreferences(prev => ({ ...prev, [key]: nextVal }))
    localStorage.setItem(key, String(nextVal))
  }

  const handleNotifPrefToggle = (key) => {
    const nextVal = !notifPreferences[key]
    setNotifPreferences(prev => ({ ...prev, [key]: nextVal }))
    localStorage.setItem(key, String(nextVal))
  }

  // 3. Feedback Form State
  const [feedbackData, setFeedbackData] = useState({
    name: '',
    email: '',
    message: '',
  })
  const [isSendingFeedback, setIsSendingFeedback] = useState(false)
  const [feedbackErrors, setFeedbackErrors] = useState({})
  const [feedbackToast, setFeedbackToast] = useState(null)

  const showFeedbackToast = (msg, type = 'success') => {
    setFeedbackToast({ text: msg, type })
    setTimeout(() => setFeedbackToast(null), 3000)
  }

  const handleFeedbackChange = (e) => {
    const { name, value } = e.target
    setFeedbackData(prev => ({ ...prev, [name]: value }))
    if (feedbackErrors[name]) {
      setFeedbackErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault()
    setFeedbackErrors({})

    // Client-side validation
    const errors = {}
    if (!feedbackData.message) {
      errors.message = 'Message is required.'
    } else if (feedbackData.message.trim().length < 10) {
      errors.message = 'Please enter at least 10 characters.'
    }

    if (Object.keys(errors).length > 0) {
      setFeedbackErrors(errors)
      return
    }

    setIsSendingFeedback(true)

    console.log("API URL:", import.meta.env.VITE_API_URL);
    console.log("Sending feedback:", {
      name: feedbackData.name.trim(),
      email: feedbackData.email.trim(),
      message: feedbackData.message.trim(),
    });

    try {
      await feedbackService.sendFeedback({
        name: feedbackData.name.trim(),
        email: feedbackData.email.trim(),
        message: feedbackData.message.trim(),
      })
      showFeedbackToast('✓ Feedback sent successfully.', 'success')
      setFeedbackData({
        name: '',
        email: '',
        message: '',
      })
    } catch (err) {
      console.error(err)
      if (err.response?.status === 400 && err.response?.data) {
        const backendErrors = {}
        Object.keys(err.response.data).forEach(key => {
          backendErrors[key] = Array.isArray(err.response.data[key])
            ? err.response.data[key].join(' ')
            : err.response.data[key]
        })
        setFeedbackErrors(backendErrors)
      } else {
        showFeedbackToast('Unable to send feedback. Please try again.', 'error')
      }
    } finally {
      setIsSendingFeedback(false)
    }
  }

  const displayName = user?.full_name ?? user?.first_name ?? 'User'
  const email = user?.email ?? 'No email provided'
  const joinDate = user?.date_joined 
    ? new Date(user.date_joined).toLocaleDateString(
        "en-US",
        {
          month: "long",
          year: "numeric",
        }
      )
    : 'Unknown date'

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  return (
    <div className="settings-page">
      
      {/* ── Section 1: Appearance ── */}
      <div className="settings-card">
        <h2 className="settings-card-title">
          <Monitor size={18} /> Appearance
        </h2>
        <div className="appearance-options">
          {/* Dark Mode - Active */}
          <div className="appearance-option appearance-option--active">
            <span className="appearance-option-title">Dark Mode</span>
            <span className="appearance-option-desc">Sleek dark glassmorphism theme</span>
            <span className="appearance-coming-soon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' }}>
              Default
            </span>
          </div>

          {/* Light Mode - Disabled */}
          <div className="appearance-option appearance-option--disabled">
            <span className="appearance-option-title">Light Mode</span>
            <span className="appearance-option-desc">Coming in V2.0 releases</span>
            <span className="appearance-coming-soon">Coming Soon</span>
          </div>
        </div>
      </div>

      {/* ── Section 2: Dashboard Preferences ── */}
      <div className="settings-card">
        <h2 className="settings-card-title">
          <Eye size={18} /> Dashboard Preferences
        </h2>
        <div className="settings-list">
          {/* Show Heatmap */}
          <div className="settings-item">
            <div className="settings-item-info">
              <span className="settings-item-label">Show Heatmap</span>
              <span className="settings-item-desc">Display the learning heatmap representing daily completions</span>
            </div>
            <label className="settings-switch">
              <input 
                type="checkbox" 
                checked={dbPreferences.showHeatmap}
                onChange={() => handleDbPrefToggle('showHeatmap')}
              />
              <span className="settings-slider"></span>
            </label>
          </div>

          {/* Show Recent Activity */}
          <div className="settings-item">
            <div className="settings-item-info">
              <span className="settings-item-label">Show Recent Activity</span>
              <span className="settings-item-desc">Display the latest feed logs of updates and achievements</span>
            </div>
            <label className="settings-switch">
              <input 
                type="checkbox" 
                checked={dbPreferences.showRecentActivity}
                onChange={() => handleDbPrefToggle('showRecentActivity')}
              />
              <span className="settings-slider"></span>
            </label>
          </div>

          {/* Show Quick Tasks */}
          <div className="settings-item">
            <div className="settings-item-info">
              <span className="settings-item-label">Show Quick Tasks</span>
              <span className="settings-item-desc">Display the quick-access panel showing pending tasks</span>
            </div>
            <label className="settings-switch">
              <input 
                type="checkbox" 
                checked={dbPreferences.showQuickTasks}
                onChange={() => handleDbPrefToggle('showQuickTasks')}
              />
              <span className="settings-slider"></span>
            </label>
          </div>

          {/* Show Top Skills */}
          <div className="settings-item">
            <div className="settings-item-info">
              <span className="settings-item-label">Show Top Skills</span>
              <span className="settings-item-desc">Display progress bars representing target skills</span>
            </div>
            <label className="settings-switch">
              <input 
                type="checkbox" 
                checked={dbPreferences.showTopSkills}
                onChange={() => handleDbPrefToggle('showTopSkills')}
              />
              <span className="settings-slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* ── Section 3: Notifications ── */}
      <div className="settings-card">
        <h2 className="settings-card-title">
          <Bell size={18} /> Notifications
        </h2>
        <div className="settings-list">
          {/* Task Reminders */}
          <div className="settings-item">
            <div className="settings-item-info">
              <span className="settings-item-label">Task Reminders</span>
              <span className="settings-item-desc">Alerts when pending tasks reach their soft deadline</span>
            </div>
            <label className="settings-switch">
              <input 
                type="checkbox" 
                checked={notifPreferences.taskReminders}
                onChange={() => handleNotifPrefToggle('taskReminders')}
              />
              <span className="settings-slider"></span>
            </label>
          </div>

          {/* Completion Notifications */}
          <div className="settings-item">
            <div className="settings-item-info">
              <span className="settings-item-label">Completion Notifications</span>
              <span className="settings-item-desc">Alert triggers upon successfully finishing tasks</span>
            </div>
            <label className="settings-switch">
              <input 
                type="checkbox" 
                checked={notifPreferences.completionNotifications}
                onChange={() => handleNotifPrefToggle('completionNotifications')}
              />
              <span className="settings-slider"></span>
            </label>
          </div>

          {/* Achievement Notifications */}
          <div className="settings-item">
            <div className="settings-item-info">
              <span className="settings-item-label">Achievement Notifications</span>
              <span className="settings-item-desc">Receive achievement unlocks and milestone triggers</span>
            </div>
            <label className="settings-switch">
              <input 
                type="checkbox" 
                checked={notifPreferences.achievementNotifications}
                onChange={() => handleNotifPrefToggle('achievementNotifications')}
              />
              <span className="settings-slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* ── Section 4: Account Settings ── */}
      <div className="settings-card">
        <h2 className="settings-card-title">
          <User size={18} /> Account Settings
        </h2>
        <div className="account-info-layout">
          <div className="account-info-details">
            <div className="account-info-field">
              <span className="account-info-label">Full Name</span>
              <span className="account-info-value">{displayName}</span>
            </div>
            <div className="account-info-field">
              <span className="account-info-label">Email Address</span>
              <span className="account-info-value">{email}</span>
            </div>
            <div className="account-info-field">
              <span className="account-info-label">Member Since</span>
              <span className="account-info-value">{joinDate}</span>
            </div>
          </div>
          <div className="account-info-actions">
            <Link to="/profile" className="settings-btn">
              Open Profile <ExternalLink size={14} />
            </Link>
            <Link to="/profile" className="settings-btn">
              Change Password <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Section 5: Application Info ── */}
      <div className="settings-card">
        <h2 className="settings-card-title">
          <Info size={18} /> Application
        </h2>
        <div className="app-details-grid">
          <div className="app-detail-row">
            <span className="app-detail-label">Version</span>
            <span className="app-detail-value">Progressly V1.6</span>
          </div>
          <div className="app-detail-row">
            <span className="app-detail-label">Developer</span>
            <span className="app-detail-value">MOHAMMED MAFAZ </span>
          </div>
          <div className="app-detail-row">
            <span className="app-detail-label">Tech Stack</span>
            <div className="tech-stack-tags">
              <span className="tech-stack-tag">React</span>
              <span className="tech-stack-tag">Django</span>
              <span className="tech-stack-tag">DRF</span>
              <span className="tech-stack-tag">PostgreSQL</span>
            </div>
          </div>
          <div className="app-detail-row">
            <span className="app-detail-label">Last Updated</span>
            <span className="app-detail-value">{currentDateStr}</span>
          </div>
        </div>
      </div>

      {/* ── Section 6: Contact Developer ── */}
      <div className="settings-card">
        <h2 className="settings-card-title">
          <Mail size={18} /> Contact Developer
        </h2>
        <div className="contact-developer-container">
          <div className="contact-developer-info">
            <div className="contact-info-row">
              <span className="contact-info-label">Developer:</span>
              <span className="contact-info-value">MOHAMMED MAFAZ</span>
            </div>
            <div className="contact-info-row">
              <span className="contact-info-label">Email:</span>
              <span className="contact-info-value">
                <a href="mailto:mafaz9416@gmail.com" className="clickable-email">
                  <Mail size={14} className="inline-icon" /> mafaz9416@gmail.com
                </a>
              </span>
            </div>
          </div>
          <p className="contact-developer-message">
            Have feedback, ideas, or found a bug?
            <br />
            Feel free to contact the developer.
          </p>
        </div>
      </div>

      {/* ── Section 7: Feedback & Suggestions ── */}
      <div className="settings-card">
        <h2 className="settings-card-title">
          <MessageSquare size={18} /> Feedback & Suggestions
        </h2>
        <p className="settings-card-subtitle">
          Your feedback helps improve this dashboard.
        </p>

        <form onSubmit={handleFeedbackSubmit} className="feedback-form">
          <div className="feedback-form-grid">
            <div className="feedback-form-group">
              <label htmlFor="feedback-name" className="feedback-label">Name (optional)</label>
              <input
                id="feedback-name"
                type="text"
                name="name"
                className="feedback-input"
                placeholder="Your name"
                value={feedbackData.name}
                onChange={handleFeedbackChange}
                disabled={isSendingFeedback}
              />
            </div>
            <div className="feedback-form-group">
              <label htmlFor="feedback-email" className="feedback-label">Email (optional)</label>
              <input
                id="feedback-email"
                type="email"
                name="email"
                className="feedback-input"
                placeholder="Your email address"
                value={feedbackData.email}
                onChange={handleFeedbackChange}
                disabled={isSendingFeedback}
              />
            </div>
          </div>

          <div className="feedback-form-group feedback-message-group">
            <label htmlFor="feedback-message" className="feedback-label">Message (required)</label>
            <textarea
              id="feedback-message"
              name="message"
              className={`feedback-textarea ${feedbackErrors.message ? 'feedback-textarea--error' : ''}`}
              placeholder="Share your feedback, ideas, bugs, or suggestions..."
              value={feedbackData.message}
              onChange={handleFeedbackChange}
              disabled={isSendingFeedback}
            />
            {feedbackErrors.message && (
              <span className="feedback-field-error">{feedbackErrors.message}</span>
            )}
          </div>

          <button
            type="submit"
            className="feedback-submit-btn"
            disabled={isSendingFeedback}
          >
            {isSendingFeedback ? (
              <>
                <Loader2 size={16} className="animate-spin feedback-spinner" />
                <span>Sending...</span>
              </>
            ) : (
              <span>Send Feedback</span>
            )}
          </button>
        </form>
      </div>

      {feedbackToast && (
        <div className={`settings-toast settings-toast--${feedbackToast.type}`}>
          {feedbackToast.text}
        </div>
      )}

    </div>
  )
}
