import React, { useState, useEffect, useCallback } from 'react'
import { 
  MessageSquare, 
  Search, 
  Mail, 
  CheckCircle, 
  Clock, 
  X, 
  Star, 
  AlertCircle,
  Filter,
  User as UserIcon,
  Send,
  Loader2,
  FileText,
  History
} from 'lucide-react'
import { adminFeedbackService } from '../services/feedbackService'
import { adminEmailLogsService } from '../services/emailLogsService'
import AdminMobileCard from '../components/common/AdminMobileCard'
import './Feedback.css'

export default function Feedback() {
  // Data state
  const [feedbacks, setFeedbacks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [statusParam, setStatusParam] = useState('all')
  const [rating, setRating] = useState('all')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')


  // Modals state
  const [selectedFeedback, setSelectedFeedback] = useState(null) // for detail modal
  const [activeReplyFeedback, setActiveReplyFeedback] = useState(null) // for reply modal
  const [replyMessage, setReplyMessage] = useState('')
  const [isSendingReply, setIsSendingReply] = useState(false)
  const [replyHistory, setReplyHistory] = useState([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // Fetch list
  const fetchFeedbackList = useCallback(async (isInitial = true) => {
    if (isInitial) setIsLoading(true)
    setError(null)

    try {
      const params = {
        search: search.trim(),
        status: statusParam !== 'all' ? statusParam : undefined,
        rating: rating !== 'all' ? rating : undefined,
        date_start: dateStart,
        date_end: dateEnd
      }
      const data = await adminFeedbackService.getFeedbackList(params)
      setFeedbacks(data.feedback || data || [])
    } catch (err) {
      console.error('Error fetching feedback list:', err)
      setError('Failed to fetch feedback entries.')
    } finally {
      setIsLoading(false)
    }
  }, [search, statusParam, rating, dateStart, dateEnd])

  useEffect(() => {
    fetchFeedbackList(true)
  }, [search, statusParam, rating, dateStart, dateEnd, fetchFeedbackList])


  // Fetch reply history for a feedback email
  const fetchReplyHistory = useCallback(async (email) => {
    if (!email) return
    setIsLoadingHistory(true)
    try {
      const data = await adminEmailLogsService.getEmailLogs({ search: email })
      const replies = (data.logs || []).filter(log => log.email_type === 'feedback_reply')
      setReplyHistory(replies)
    } catch (err) {
      console.error('Failed to load reply history:', err)
    } finally {
      setIsLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    if (selectedFeedback) {
      const email = selectedFeedback.user?.email || selectedFeedback.email
      fetchReplyHistory(email)
    } else {
      setReplyHistory([])
    }
  }, [selectedFeedback, fetchReplyHistory])

  // Handle status update
  const handleUpdateStatus = async (fb, newStatus) => {
    try {
      const updated = await adminFeedbackService.updateFeedbackStatus(fb.id, {
        status: newStatus
      })
      // Update local state for both list and selected modal feedback
      setFeedbacks(prev => prev.map(item => item.id === fb.id ? { ...item, status: newStatus } : item))
      if (selectedFeedback && selectedFeedback.id === fb.id) {
        setSelectedFeedback(prev => ({ ...prev, status: newStatus }))
      }
      fetchFeedbackList(false)
    } catch (err) {
      console.error('Error updating feedback status:', err)
      alert('Failed to update status.')
    }
  }

  // Handle Send Reply Submit
  const handleReplySubmit = async (e) => {
    e.preventDefault()
    if (!replyMessage.trim() || isSendingReply) return
    setIsSendingReply(true)

    try {
      await adminFeedbackService.replyFeedback(activeReplyFeedback.id, {
        reply_message: replyMessage.trim() // fixed param name to match backend
      })
      alert('Reply sent successfully, feedback status marked as resolved.')
      
      const targetEmail = activeReplyFeedback.user?.email || activeReplyFeedback.email
      
      // Auto resolve active states
      setFeedbacks(prev => prev.map(item => item.id === activeReplyFeedback.id ? { ...item, status: 'resolved' } : item))
      if (selectedFeedback && selectedFeedback.id === activeReplyFeedback.id) {
        setSelectedFeedback(prev => ({ ...prev, status: 'resolved' }))
      }

      setActiveReplyFeedback(null)
      setReplyMessage('')
      fetchFeedbackList(false)
      fetchReplyHistory(targetEmail)
    } catch (err) {
      console.error('Error sending feedback reply:', err)
      alert(err.response?.data?.detail || 'Failed to send reply email.')
    } finally {
      setIsSendingReply(false)
    }
  }

  // Star rating helper
  const renderStars = (num) => {
    const stars = []
    const count = parseInt(num) || 5
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          className={`star-icon ${i <= count ? 'filled' : 'empty'}`} 
        />
      )
    }
    return <div className="stars-row">{stars}</div>
  }

  return (
    <div className="admin-feedback-container">
      {/* Header section */}
      <div className="admin-feedback-header">
        <div className="header-left">
          <div className="header-icon-wrapper">
            <MessageSquare className="header-icon" />
          </div>
          <div>
            <h1 className="admin-feedback-title">User Feedback &amp; Support</h1>
            <p className="admin-feedback-subtitle">Review suggestions, reports, and ratings from registered &amp; guest users</p>
          </div>
        </div>
      </div>

      {/* Filter and controls bar */}
      <div className="admin-feedback-filter-bar admin-glow-card">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, email, subject, or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="feedback-search-input"
          />
        </div>

        <div className="filters-group">
          <div className="filter-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)' }}>From:</span>
            <input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="admin-users-select"
              style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--admin-border-color)', borderRadius: '6px', color: '#94a3b8' }}
              id="feedback-date-start"
            />
          </div>
          <div className="filter-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)' }}>To:</span>
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="admin-users-select"
              style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--admin-border-color)', borderRadius: '6px', color: '#94a3b8' }}
              id="feedback-date-end"
            />
          </div>

          <div className="filter-item">
            <Filter className="filter-icon" />
            <select value={statusParam} onChange={(e) => setStatusParam(e.target.value)} id="feedback-status-select">

              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div className="filter-item">
            <Star className="filter-icon" />
            <select value={rating} onChange={(e) => setRating(e.target.value)} id="feedback-rating-select">
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedback entries log */}
      {error && (
        <div className="admin-feedback-error-alert">
          <AlertCircle className="error-alert-icon" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="admin-feedback-loading">
          <div className="spinner"></div>
          <p>Loading feedback records...</p>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="admin-feedback-empty-state admin-glow-card">
          <MessageSquare className="empty-icon" />
          <h3>No Feedback Records</h3>
          <p>Currently, there are no matching feedback entries in the registry.</p>
        </div>
      ) : (
        <>
          {/* Desktop/Tablet Table View */}
          <div className="desktop-only-view feedback-table-card admin-glow-card">
            <div className="feedback-table-wrap">
              <table className="admin-feedback-table">
                <thead>
                  <tr>
                    <th>Submitter</th>
                    <th>Rating</th>
                    <th>Subject</th>
                    <th>Submitted Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map((fb) => (
                    <tr key={fb.id} className="feedback-tr--clickable" onClick={() => setSelectedFeedback(fb)}>
                      <td>
                        <div className="user-owner-cell" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <UserIcon size={16} className="owner-icon" style={{ color: 'var(--admin-text-muted)' }} />
                          <div>
                            <div className="owner-name" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--admin-text-primary)' }}>{fb.name || 'Anonymous Submitter'}</div>
                            <div className="owner-email" style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>{fb.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{renderStars(fb.rating)}</td>
                      <td className="feedback-td-subject" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fb.subject || 'No Subject'}</td>
                      <td>{new Date(fb.created_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-pill status-${fb.status || 'pending'}`}>
                          {fb.status}
                        </span>
                      </td>
                      <td>
                        <div className="actions-cell" style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                          <button onClick={() => setSelectedFeedback(fb)} className="action-btn edit" style={{ padding: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--admin-border-color)', borderRadius: '6px', cursor: 'pointer', color: 'var(--admin-text-secondary)' }} title="View Detail"><FileText size={14} /></button>
                          <button 
                            onClick={() => {
                              setActiveReplyFeedback(fb)
                              setReplyMessage('')
                              setReplyHistory([])
                            }} 
                            className="action-btn reply" 
                            style={{ padding: '6px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '6px', cursor: 'pointer', color: 'var(--admin-accent-purple)' }}
                            title="Reply"
                          >
                            <Send size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List View */}
          <div className="mobile-only-view feedback-cards-mobile" style={{ display: 'none', flexDirection: 'column', gap: '12px' }}>
            {feedbacks.map((fb) => (
              <AdminMobileCard
                key={fb.id}
                title={fb.name || 'Anonymous Submitter'}
                subtitle={fb.email}
                icon={MessageSquare}
                badge={
                  <span className={`status-pill status-${fb.status || 'pending'}`} style={{ fontSize: '0.65rem' }}>
                    {fb.status}
                  </span>
                }
                fields={[
                  { label: 'Rating', value: `${fb.rating} / 5 Stars` },
                  { label: 'Subject', value: fb.subject },
                  { label: 'Message', value: fb.comment || fb.message },
                  { label: 'Submitted', value: new Date(fb.created_at).toLocaleDateString() }
                ]}
                actions={[
                  { icon: FileText, label: 'Detail', onClick: () => setSelectedFeedback(fb) },
                  { icon: Send, label: 'Reply', onClick: () => { setActiveReplyFeedback(fb); setReplyMessage(''); setReplyHistory([]); } }
                ]}
              />
            ))}
          </div>
        </>
      )}

      {/* Detail Modal */}
      {selectedFeedback && (
        <div className="emaillogs-modal-overlay" onClick={() => setSelectedFeedback(null)}>
          <div className="feedback-detail-modal admin-glow-card" onClick={e => e.stopPropagation()}>
            <div className="emaillogs-modal__header">
              <div className="emaillogs-modal__title">
                <FileText size={18} className="icon-purple" />
                Feedback Details
              </div>
              <button className="emaillogs-modal__close" onClick={() => setSelectedFeedback(null)} id="feedback-detail-close">
                <X size={18} />
              </button>
            </div>
            <div className="emaillogs-modal__body">
              <div className="feedback-detail-meta">
                <div className="submitter-info">
                  <div className="submitter-avatar">
                    {selectedFeedback.avatar_url ? <img src={selectedFeedback.avatar_url} alt="avatar" /> : <UserIcon className="avatar-placeholder" />}
                  </div>
                  <div>
                    <h4 className="submitter-name">{selectedFeedback.name || 'Anonymous'}</h4>
                    <span className="submitter-email-tag">@{selectedFeedback.user_username || 'guest'} • {selectedFeedback.email}</span>
                  </div>
                </div>
                <div className="meta-right">
                  {renderStars(selectedFeedback.rating)}
                  <span className="feedback-date">{selectedFeedback.created_at}</span>
                </div>
              </div>

              <div className="feedback-detail-content">
                <h3 className="feedback-detail-subject">{selectedFeedback.subject || 'General Feedback'}</h3>
                <div className="feedback-detail-message-box">
                  {selectedFeedback.comment}
                </div>
              </div>

              {/* Status Action Buttons Inside Modal */}
              <div className="feedback-detail-status-actions">
                <span className="status-label">Current Status: <strong className={`status-${selectedFeedback.status}`}>{selectedFeedback.status}</strong></span>
                <div className="action-buttons-group">
                  <button
                    onClick={() => handleUpdateStatus(selectedFeedback, 'pending')}
                    className="backups-btn backups-btn--secondary"
                    disabled={selectedFeedback.status === 'pending'}
                  >
                    Mark Pending
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedFeedback, 'reviewed')}
                    className="backups-btn backups-btn--secondary"
                    disabled={selectedFeedback.status === 'reviewed'}
                  >
                    Mark Reviewed
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedFeedback, 'resolved')}
                    className="backups-btn backups-btn--primary"
                    disabled={selectedFeedback.status === 'resolved'}
                  >
                    Mark Resolved
                  </button>
                  <button
                    onClick={() => {
                      setActiveReplyFeedback(selectedFeedback)
                      setReplyMessage('')
                    }}
                    className="reply-action-btn"
                  >
                    <Mail size={13} className="btn-inline-icon" />
                    Compose Reply
                  </button>
                </div>
              </div>

              {/* Reply History section */}
              <div className="feedback-reply-history-section">
                <h4 className="history-section-title">
                  <History size={14} className="inline-icon" />
                  Email Correspondence History
                </h4>
                {isLoadingHistory ? (
                  <div className="history-loading"><Loader2 size={16} className="spin" /> Checking history...</div>
                ) : replyHistory.length === 0 ? (
                  <p className="no-history-text">No previous official replies sent to this recipient email.</p>
                ) : (
                  <div className="history-timeline">
                    {replyHistory.map(reply => (
                      <div key={reply.id} className="history-timeline-item">
                        <div className="history-item-top">
                          <span className="sender">By: @{reply.created_by}</span>
                          <span className="time">{new Date(reply.sent_at).toLocaleString()}</span>
                        </div>
                        <div className="subject">Subject: {reply.subject}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reply Compose Modal */}
      {activeReplyFeedback && (
        <div className="admin-feedback-modal-overlay" onClick={() => setActiveReplyFeedback(null)}>
          <div className="admin-feedback-modal admin-glow-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reply to Feedback Submission</h3>
              <button onClick={() => setActiveReplyFeedback(null)} className="close-btn" id="feedback-reply-close">
                <X />
              </button>
            </div>
            <div className="reply-target-details">
              <div className="detail-row">
                <span className="label">To:</span>
                <span className="value">
                  {activeReplyFeedback.name || 'User'} ({activeReplyFeedback.email})
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Subject:</span>
                <span className="value">Re: {activeReplyFeedback.subject || 'Feedback'}</span>
              </div>
            </div>
            <form onSubmit={handleReplySubmit} className="modal-form">
              <div className="form-group">
                <label>Support Email Response Body</label>
                <textarea
                  rows={6}
                  required
                  placeholder="Type your official Progressly support response..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  disabled={isSendingReply}
                  id="feedback-reply-textarea"
                />
                <span className="help-text">
                  Note: Sending this reply will dispatch an email in the background and transition the feedback status to <strong>Resolved</strong>.
                </span>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setActiveReplyFeedback(null)}
                  className="cancel-btn"
                  disabled={isSendingReply}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingReply}
                  className="save-btn"
                  id="feedback-reply-submit"
                >
                  {isSendingReply ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

