import React from 'react'
import { UserPlus, CheckCircle2, Award, MessageSquare, LogIn, Circle } from 'lucide-react'
import './RecentActivity.css'

export default function RecentActivity({ activities = [], isLoading, onViewAll }) {
  
  // Maps activity text to Lucide icons and colors
  const getActivityStyles = (text = '') => {
    const txt = text.toLowerCase()
    
    if (txt.includes('register') || txt.includes('signup')) {
      return { icon: UserPlus, color: 'blue', textClass: 'admin-activity-item__icon--blue' }
    }
    if (txt.includes('task completed') || txt.includes('completion')) {
      return { icon: CheckCircle2, color: 'green', textClass: 'admin-activity-item__icon--green' }
    }
    if (txt.includes('skill')) {
      return { icon: Award, color: 'purple', textClass: 'admin-activity-item__icon--purple' }
    }
    if (txt.includes('feedback') || txt.includes('review')) {
      return { icon: MessageSquare, color: 'orange', textClass: 'admin-activity-item__icon--orange' }
    }
    if (txt.includes('login') || txt.includes('logged')) {
      return { icon: LogIn, color: 'cyan', textClass: 'admin-activity-item__icon--cyan' }
    }
    
    return { icon: Circle, color: 'purple', textClass: 'admin-activity-item__icon--purple' }
  }

  // Handle Loading Skeleton State
  if (isLoading) {
    return (
      <div className="admin-list-card admin-glow-card">
        <div className="admin-list-card__header">
          <div className="admin-list-card__title-skeleton skeleton-shimmer" />
          <div className="admin-list-card__link-skeleton skeleton-shimmer" />
        </div>
        <div className="admin-list-card__body">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="admin-activity-row admin-activity-row--skeleton">
              <div className="admin-activity-row__dot-skeleton skeleton-shimmer" />
              <div className="admin-activity-row__text-skeleton">
                <div className="admin-activity-row__title-skeleton skeleton-shimmer" />
                <div className="admin-activity-row__time-skeleton skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const hasActivities = activities && activities.length > 0

  return (
    <div className="admin-list-card admin-glow-card">
      <div className="admin-list-card__header">
        <div className="admin-list-card__title-group">
          <h3 className="admin-list-card__title">Recent Activity</h3>
          <span className="admin-list-card__subtitle">Latest system actions</span>
        </div>
        {hasActivities && (
          <button 
            onClick={onViewAll} 
            className="admin-list-card__action-link"
            id="admin-recent-activity-view-all"
          >
            View All
          </button>
        )}
      </div>

      <div className="admin-list-card__body">
        {hasActivities ? (
          <div className="admin-list-card__rows">
            {activities.slice(0, 5).map((act) => {
              const styles = getActivityStyles(act.text)
              const IconComponent = styles.icon
              return (
                <div key={act.id} className="admin-activity-row">
                  <div className={`admin-activity-row__icon-container ${styles.textClass}`}>
                    <IconComponent size={14} strokeWidth={2.2} />
                  </div>
                  
                  <div className="admin-activity-row__info">
                    <span className="admin-activity-row__text">{act.text}</span>
                    <span className="admin-activity-row__time">{act.time}</span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="admin-list-card__empty">No system activity logged.</div>
        )}
      </div>
    </div>
  )
}
