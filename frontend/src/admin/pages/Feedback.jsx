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
  Send
} from 'lucide-react'
import { adminFeedbackService } from '../services/feedbackService'
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

  // Reply Modal State
  const [activeReplyFeedback, setActiveReplyFeedback] = useState(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [isSendingReply, setIsSendingReply] = useState(false)

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

  // Handle status toggle
  const handleToggleStatus = async (fb) => {
    const newStatus = fb.status === 'resolved' ? 'pending' : 'resolved'
    try {
      await adminFeedbackService.updateFeedbackStatus(fb.id, {
        status: newStatus
      })
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
        message: replyMessage.trim()
      })
      alert('Reply sent and feedback marked as resolved.')
      setActiveReplyFeedback(null)
      setReplyMessage('')
      fetchFeedbackList(false)
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
            <h1 className="admin-feedback-title">User Feedback & Support</h1>
            <p className="admin-feedback-subtitle">Review suggestions, reports, and ratings from registered & guest users</p>
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
          />
        </div>

        <div className="filters-group">
          <div className="filter-item">
            <Filter className="filter-icon" />
            <select value={statusParam} onChange={(e) => setStatusParam(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div className="filter-item">
            <Star className="filter-icon" />
            <select value={rating} onChange={(e) => setRating(e.target.value)}>
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
            <div key={fb.id} className={`feedback-card admin-glow-card status-${fb.status || 'pending'}`}>
              <div className="feedback-card-top">
                <div className="submitter-info">
                  <div className="submitter-avatar">
                    {fb.user?.profile?.avatar ? (
                      <img src={fb.user.profile.avatar} alt="avatar" />
                    ) : (
                      <UserIcon className="avatar-placeholder" />
                    )}
                  </div>
                  <div>
                    <h4 className="submitter-name">
                      {fb.user?.profile?.full_name || fb.name || 'Anonymous Submitter'}
                    </h4>
                    <span className="submitter-email-tag">
                      <Mail className="inline-icon" />
                      {fb.user?.email || fb.email || 'No email registered'}
                    </span>
                  </div>
                </div>

                <div className="meta-right">
                  {renderStars(fb.rating)}
                  <span className="feedback-date">
                    {new Date(fb.created_at || fb.submitted_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="feedback-card-content">
                <h3 className="feedback-subject">{fb.subject || 'No Subject Provided'}</h3>
                <p className="feedback-comment">{fb.comment || fb.message}</p>
              </div>

              <div className="feedback-card-actions">
                <div className="status-label-group">
                  <span className={`status-dot-label ${fb.status || 'pending'}`}>
                    {fb.status === 'resolved' ? 'Resolved' : 'Pending Review'}
                  </span>
                </div>
                
                <div className="action-buttons-group">
                  <button 
                    onClick={() => handleToggleStatus(fb)} 
                    className={`status-toggle-action-btn ${fb.status === 'resolved' ? 'mark-pending' : 'mark-resolved'}`}
                  >
                    {fb.status === 'resolved' ? (
                      <>
                        <Clock className="btn-inline-icon" />
                        Re-open Feedback
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
                  >
                    <Mail className="btn-inline-icon" />
                    Reply via Email
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Modal */}
      {activeReplyFeedback && (
        <div className="admin-feedback-modal-overlay">
          <div className="admin-feedback-modal admin-glow-card">
            <div className="modal-header">
              <h3>Reply to Feedback Submission</h3>
              <button onClick={() => setActiveReplyFeedback(null)} className="close-btn">
                <X />
              </button>
            </div>
            <div className="reply-target-details">
              <div className="detail-row">
                <span className="label">To:</span>
                <span className="value">
                  {activeReplyFeedback.user?.profile?.full_name || activeReplyFeedback.name || 'User'} ({activeReplyFeedback.user?.email || activeReplyFeedback.email})
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
                />
                <span className="help-text">
                  Note: Sending this reply will immediately dispatch an email to the user and automatically transition this feedback status to <strong>Resolved</strong>.
                </span>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setActiveReplyFeedback(null)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingReply}
                  className="save-btn"
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
