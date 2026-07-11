import React, { useState, useEffect, useCallback } from 'react'
import { 
  Bell, 
  Send, 
  Globe, 
  User, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  AlertTriangle,
  Clock,
  Check,
  Mail,
  Loader2
} from 'lucide-react'
import { adminNotificationsService } from '../services/notificationsService'
import { adminEmailLogsService } from '../services/emailLogsService'
import AdminMobileCard from '../components/common/AdminMobileCard'
import './Notifications.css'

export default function Notifications() {
  // Data state
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Email logging counts
  const [emailStats, setEmailStats] = useState({ sent: 0, failed: 0 })

  // Send Alert Form State
  const [form, setForm] = useState({
    send_to_type: 'all', // 'all' or 'single'
    email: '',
    title: '',
    message: '',
    level: 'info', // 'info', 'success', 'warning', 'danger'
    send_email: false // ☑ Send email option
  })
  const [isSending, setIsSending] = useState(false)
  const [sendSuccess, setSendSuccess] = useState(false)

  // Fetch log
  const fetchNotificationsLog = useCallback(async (isInitial = true) => {
    if (isInitial) setIsLoading(true)
    setError(null)
    try {
      const data = await adminNotificationsService.getNotificationsList()
      setNotifications(data.notifications || [])

      // Fetch Email Logs stats dynamically to show real sent/failed email counts
      const emailData = await adminEmailLogsService.getEmailLogs({ limit: 1 })
      setEmailStats({
        sent: emailData.sent_count || 0,
        failed: emailData.failed_count || 0
      })
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setError('Failed to fetch past notification logs.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotificationsLog(true)
  }, [fetchNotificationsLog])

  // Handle Send Submit
  const handleSendSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.message.trim() || isSending) return
    if (form.send_to_type === 'single' && !form.email.trim()) {
      alert('Recipient email address is required.')
      return
    }

    setIsSending(true)
    setSendSuccess(false)
    setError(null)

    try {
      await adminNotificationsService.sendNotificationAlert({
        send_to_type: form.send_to_type,
        email: form.send_to_type === 'single' ? form.email.trim() : undefined,
        title: form.title.trim(),
        message: form.message.trim(),
        level: form.level,
        send_email: form.send_email // backend support
      })
      setSendSuccess(true)
      setForm(prev => ({
        ...prev,
        email: '',
        title: '',
        message: '',
        send_email: false
      }))
      fetchNotificationsLog(false)
      
      // Dispatch custom event to notify Sidebar dynamic badge to refresh
      window.dispatchEvent(new CustomEvent('notification-changed'))

      setTimeout(() => setSendSuccess(false), 5000)
    } catch (err) {
      console.error('Error sending alert:', err)
      setError(err.response?.data?.detail || 'Failed to dispatch notification alert.')
    } finally {
      setIsSending(false)
    }
  }

  // Helper for status icon
  const getLevelIcon = (level) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="notif-level-icon text-success" />
      case 'warning':
        return <AlertTriangle className="notif-level-icon text-warning" />
      case 'danger':
        return <AlertCircle className="notif-level-icon text-danger" />
      default:
        return <Info className="notif-level-icon text-info" />
    }
  }

  return (
    <div className="admin-notifs-container">
      {/* Header section */}
      <div className="admin-notifs-header">
        <div className="header-left">
          <div className="header-icon-wrapper">
            <Bell className="header-icon" />
          </div>
          <div>
            <h1 className="admin-notifs-title">Alerts &amp; Broadcasts</h1>
            <p className="admin-notifs-subtitle">Dispatch system notices and targeted bell notifications</p>
          </div>
        </div>
      </div>

      <div className="admin-notifs-grid">
        {/* Action Panel: Send alert form */}
        <div className="admin-notifs-form-card admin-glow-card">
          <h2 className="card-header-title">Send Notification Alert</h2>
          
          <form onSubmit={handleSendSubmit} className="dispatch-form">
            <div className="form-group">
              <label>Target Audience</label>
              <div className="audience-toggle-group">
                <button
                  type="button"
                  className={`audience-btn ${form.send_to_type === 'all' ? 'active' : ''}`}
                  onClick={() => setForm({ ...form, send_to_type: 'all' })}
                  disabled={isSending}
                >
                  <Globe className="btn-inline-icon" />
                  Broadcast (All Active Users)
                </button>
                <button
                  type="button"
                  className={`audience-btn ${form.send_to_type === 'single' ? 'active' : ''}`}
                  onClick={() => setForm({ ...form, send_to_type: 'single' })}
                  disabled={isSending}
                >
                  <User className="btn-inline-icon" />
                  Target Specific Learner
                </button>
              </div>
            </div>

            {form.send_to_type === 'single' && (
              <div className="form-group animate-slide-down">
                <label>Learner Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. learner@progressly.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={isSending}
                  id="notif-target-email"
                />
              </div>
            )}

            <div className="form-row">
              <div className="form-group flex-2">
                <label>Alert Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. System Maintenance Window"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  disabled={isSending}
                  id="notif-title-input"
                />
              </div>

              <div className="form-group flex-1">
                <label>Severity Level</label>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  className={`level-select ${form.level}`}
                  disabled={isSending}
                  id="notif-level-select"
                >
                  <option value="info">Info (Blue)</option>
                  <option value="success">Success (Green)</option>
                  <option value="warning">Warning (Amber)</option>
                  <option value="danger">Danger (Red)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Notification Message</label>
              <textarea
                rows={4}
                required
                placeholder="Write system alert message details here..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                disabled={isSending}
                id="notif-message-textarea"
              />
            </div>

            <div className="form-group send-email-checkbox-wrap">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={form.send_email}
                  onChange={(e) => setForm({ ...form, send_email: e.target.checked })}
                  disabled={isSending}
                  id="notif-email-checkbox"
                />
                <span className="checkbox-text">
                  <Mail size={14} className="inline-icon" />
                  Send email notification in background
                </span>
              </label>
            </div>

            {sendSuccess && (
              <div className="success-banner animate-fade-in">
                <Check className="success-banner-icon" />
                <span>Notification successfully dispatched.</span>
              </div>
            )}

            <button type="submit" disabled={isSending} className="send-action-btn" id="notif-submit-btn">
              {isSending ? (
                <>
                  <Loader2 size={16} className="notif-spin" />
                  Sending Alert...
                </>
              ) : (
                <>
                  <Send className="btn-send-icon" />
                  Send Notification
                </>
              )}
            </button>
          </form>
        </div>

        {/* Audit Panel: Past dispatch history log */}
        <div className="admin-notifs-log-card admin-glow-card">
          <div className="card-header-with-badge">
            <h2 className="card-header-title">Notification Log History</h2>
            <div className="notif-count-summary">
              <span className="count-pill sent">{emailStats.sent} Sent</span>
              <span className="count-pill failed">{emailStats.failed} Failed</span>
            </div>
          </div>

          {error && (
            <div className="admin-notifs-error-alert">
              <AlertCircle className="error-alert-icon" />
              <span>{error}</span>
            </div>
          )}

          {isLoading && notifications.length === 0 ? (
            <div className="admin-notifs-loading">
              <div className="spinner"></div>
              <p>Loading notification logs...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="admin-notifs-empty-state">
              <Bell className="empty-icon" />
              <p>No historical admin notifications sent yet.</p>
            </div>
          ) : (
            <>
              <div className="desktop-only-view">
                <div className="notif-log-list">
                  {notifications.map((notif) => (
                    <div key={notif.id} className={`notif-log-item border-${notif.level || 'info'}`}>
                      <div className="notif-log-top">
                        <div className="notif-log-title-group">
                          {getLevelIcon(notif.level)}
                          <span className="notif-log-title">{notif.title}</span>
                        </div>
                        <div className="notif-log-date">
                          <Clock className="time-icon" />
                          <span>{new Date(notif.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      <p className="notif-log-msg">{notif.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mobile-only-view notif-cards-mobile" style={{ display: 'none', flexDirection: 'column', gap: '12px' }}>
                {notifications.map((notif) => (
                  <AdminMobileCard
                    key={notif.id}
                    title={notif.title}
                    subtitle={new Date(notif.created_at).toLocaleString()}
                    icon={Bell}
                    badge={
                      <span className={`status-pill status-${notif.level || 'info'}`} style={{ fontSize: '0.65rem' }}>
                        {notif.level || 'info'}
                      </span>
                    }
                    fields={[
                      { label: 'Message', value: notif.message }
                    ]}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

