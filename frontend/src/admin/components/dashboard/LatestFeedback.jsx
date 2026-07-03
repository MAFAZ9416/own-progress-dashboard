import React from 'react'
import { Star, MessageSquare } from 'lucide-react'
import './LatestFeedback.css'

export default function LatestFeedback({ feedbackData = [], isLoading }) {
  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name[0].toUpperCase()
  }

  const renderStars = (rating = 5) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          size={11} 
          fill={i <= rating ? '#fbbf24' : 'none'} 
          stroke={i <= rating ? '#fbbf24' : 'var(--admin-text-muted)'} 
          className="admin-feedback-row__star"
        />
      )
    }
    return stars
  }

  if (isLoading) {
    return (
      <div className="admin-list-card admin-glow-card">
        <div className="admin-list-card__header">
          <div className="admin-list-card__title-skeleton skeleton-shimmer" />
          <div className="admin-list-card__link-skeleton skeleton-shimmer" />
        </div>
        <div className="admin-list-card__body">
          {[1, 2, 3].map((i) => (
            <div key={i} className="admin-feedback-row admin-feedback-row--skeleton">
              <div className="admin-feedback-row__avatar-skeleton skeleton-shimmer" />
              <div className="admin-feedback-row__content-skeleton">
                <div className="admin-feedback-row__header-skeleton">
                  <div className="admin-feedback-row__name-skeleton skeleton-shimmer" />
                  <div className="admin-feedback-row__stars-skeleton skeleton-shimmer" />
                </div>
                <div className="admin-feedback-row__text-skeleton skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const hasFeedback = feedbackData && feedbackData.length > 0

  return (
    <div className="admin-list-card admin-glow-card">
      <div className="admin-list-card__header">
        <div className="admin-list-card__title-group">
          <h3 className="admin-list-card__title">Latest Feedback</h3>
          <span className="admin-list-card__subtitle">User reviews & ratings</span>
        </div>
        <MessageSquare size={16} className="admin-feedback-header-icon" />
      </div>

      <div className="admin-list-card__body">
        {hasFeedback ? (
          <div className="admin-feedback-rows">
            {feedbackData.slice(0, 3).map((item) => (
              <div key={item.id} className="admin-feedback-row">
                <div className="admin-feedback-row__avatar-container">
                  {item.avatar ? (
                    <img 
                      src={item.avatar} 
                      alt={item.name} 
                      className="admin-feedback-row__avatar"
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  ) : (
                    <div className="admin-feedback-row__avatar-fallback">
                      {getInitials(item.name)}
                    </div>
                  )}
                </div>

                <div className="admin-feedback-row__content">
                  <div className="admin-feedback-row__header-info">
                    <span className="admin-feedback-row__name">{item.name}</span>
                    <div className="admin-feedback-row__stars-wrap">
                      {renderStars(item.rating)}
                    </div>
                  </div>

                  <span className="admin-feedback-row__comment">"{item.comment}"</span>

                  <div className="admin-feedback-row__footer">
                    <span className="admin-feedback-row__date">{item.time}</span>
                    <span className="admin-feedback-row__badge">Approved</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-list-card__empty">No customer feedback logs available.</div>
        )}
      </div>
    </div>
  )
}
