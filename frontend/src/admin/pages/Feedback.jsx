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
import './Feedback.css'

export default function Feedback() {
  // Data state
  const [feedbacks, setFeedbacks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [search, setSearch] = useState('')
  const [statusParam, setStatusParam] = useState('all')
  const [rating, setRating] = useState('all')

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
        rating: rating !== 'all' ? rating : undefined
      }
      const data = await adminFeedbackService.getFeedbackList(params)
      setFeedbacks(data.feedback || data || [])
    } catch (err) {
      console.error('Error fetching feedback list:', err)
      setError('Failed to fetch feedback entries.')
    } finally {
      setIsLoading(false)
    }
  }, [search, statusParam, rating])

  useEffect(() => {
    fetchFeedbackList(true)
  }, [search, statusParam, rating, fetchFeedbackList])

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
        <div className="feedback-list">
          {feedbacks.map((fb) => (
            <div 
              key={fb.id} 
              className={`feedback-card admin-glow-card status-${fb.status || 'pending'} feedback-card--clickable`}
              onClick={() => setSelectedFeedback(fb)}
            >
              <div className="feedback-card-top">
                <div className="submitter-info">
                  <div className="submitter-avatar">
                    {fb.avatar ? (
                      <img src={fb.avatar} alt="avatar" />
                    ) : (
                      <UserIcon className="avatar-placeholder" />
                    )}
                  </div>
                  <div>
                    <h4 className="submitter-name">
                      {fb.name || 'Anonymous Submitter'}
                    </h4>
                    <span className="submitter-email-tag">
                      <Mail className="inline-icon" />
                      {fb.email || 'No email registered'}
                    </span>
                  </div>
                </div>

                <div className="meta-right">
                  {renderStars(fb.rating)}
                  <span className="feedback-date">
                    {fb.created_at}
                  </span>
                </div>
              </div>

              <div className="feedback-card-content">
                <h3 className="feedback-subject">{fb.subject || 'No Subject Provided'}</h3>
                <p className="feedback-comment">{fb.comment || fb.message}</p>
              </div>

              <div className="feedback-card-actions" onClick={e => e.stopPropagation()}>
                <div className="status-label-group">
                  <span className={`status-dot-label ${fb.status || 'pending'}`}>
                    {fb.status === 'resolved' ? 'Resolved' : fb.status === 'reviewed' ? 'Reviewed' : 'Pending Review'}
                  </span>
                </div>
                
                <div className="action-buttons-group">
                  <button 
                    onClick={() => handleUpdateStatus(fb, fb.status === 'resolved' ? 'pending' : 'resolved')} 
                    className={`status-toggle-action-btn ${fb.status === 'resolved' ? 'mark-pending' : 'mark-resolved'}`}
                    id={`btn-resolve-${fb.id}`}
                  >
                    {fb.status === 'resolved' ? (
                      <>
                        <Clock className="btn-inline-icon" />
                        Re-open
                      </>
                    ) : (
                      <>
                        <CheckCircle className="btn-inline-icon" />
                        Mark Resolved
                      </>
                    )}
                  </button>

                  <button 
                    onClick={() => {
                      setActiveReplyFeedback(fb)
                      setReplyMessage('')
                    }} 
                    className="reply-action-btn"
                    id={`btn-reply-${fb.id}`}
                  >
                    <Mail className="btn-inline-icon" />
                    Reply Email
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
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
                    {selectedFeedback.avatar ? <img src={selectedFeedback.avatar} alt="avatar" /> : <UserIcon className="avatar-placeholder" />}
                  </div>
                  <div>
                    <h4 className="submitter-name">{selectedFeedback.name}</h4>
                    <span className="submitter-email-tag">@{selectedFeedback.user || 'guest'} • {selectedFeedback.email}</span>
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
                    onClick={() => handleUpdateStatus(selectedFeedback, 'reviewed')}
                    className="backups-btn backups-btn--secondary"
                    disabled={selectedFeedback.status === 'reviewed'}
                  >
                    Mark Reviewed
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedFeedback, selectedFeedback.status === 'resolved' ? 'pending' : 'resolved')}
                    className="backups-btn backups-btn--primary"
                  >
                    {selectedFeedback.status === 'resolved' ? 'Re-open Review' : 'Mark Resolved'}
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

