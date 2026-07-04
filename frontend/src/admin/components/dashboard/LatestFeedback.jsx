import React from 'react'
import { MessageSquare } from 'lucide-react'
import './LatestFeedback.css'

export default function LatestFeedback({ feedbackData = [], isLoading }) {
  const [failedAvatars, setFailedAvatars] = React.useState({})

  const handleAvatarError = (id) => {
    setFailedAvatars((prev) => ({ ...prev, [id]: true }))
  }

  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name[0].toUpperCase()
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
          <span className="admin-list-card__subtitle">User suggestions & contact submissions</span>
        </div>
        <MessageSquare size={16} className="admin-feedback-header-icon" />
      </div>

      <div className="admin-list-card__body">
        {hasFeedback ? (
          <div className="admin-feedback-rows">
            {feedbackData.slice(0, 3).map((item) => {
              const showFallback = !item.avatar || failedAvatars[item.id]
              return (
                <div key={item.id} className="admin-feedback-row">
                  <div className="admin-feedback-row__avatar-container">
                    {showFallback ? (
                      <div className="admin-feedback-row__avatar-fallback">
                        {getInitials(item.name)}
                      </div>
                    ) : (
                      <img 
                        src={item.avatar} 
                        alt={item.name} 
                        className="admin-feedback-row__avatar"
                        onError={() => handleAvatarError(item.id)}
                      />
                    )}
                  </div>

                <div className="admin-feedback-row__content">
                  <div className="admin-feedback-row__header-info">
                    <div className="admin-feedback-row__identity">
                      <span className="admin-feedback-row__name">{item.name}</span>
                      {item.email && <span className="admin-feedback-row__email">{item.email}</span>}
                    </div>
                  </div>

                  <span className="admin-feedback-row__comment">"{item.message}"</span>

                  <div className="admin-feedback-row__footer">
                    <span className="admin-feedback-row__date">{item.created_at}</span>
                    <span className="admin-feedback-row__badge">{item.status || 'Submitted'}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        ) : (
          <div className="admin-list-card__empty">No feedback received</div>
        )}
      </div>
    </div>
  )
}
