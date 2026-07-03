import React from 'react'
import { Bell, Info, CheckCircle2, AlertTriangle, AlertCircle, Circle } from 'lucide-react'
import './Notifications.css'

export default function Notifications({ notificationsData = [], isLoading }) {
  const getLevelStyles = (level = 'info') => {
    const l = level.toLowerCase()
    if (l === 'success') {
      return { icon: CheckCircle2, textClass: 'admin-notif-item__icon--success' }
    }
    if (l === 'warning') {
      return { icon: AlertTriangle, textClass: 'admin-notif-item__icon--warning' }
    }
    if (l === 'error' || l === 'danger') {
      return { icon: AlertCircle, textClass: 'admin-notif-item__icon--error' }
    }
    return { icon: Info, textClass: 'admin-notif-item__icon--info' }
  }

  if (isLoading) {
    return (
      <div className="admin-list-card admin-glow-card">
        <div className="admin-list-card__header">
          <div className="admin-list-card__title-skeleton skeleton-shimmer" />
          <div className="admin-list-card__link-skeleton skeleton-shimmer" />
        </div>
        <div className="admin-list-card__body">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="admin-notif-row admin-notif-row--skeleton">
              <div className="admin-notif-row__icon-skeleton skeleton-shimmer" />
              <div className="admin-notif-row__content-skeleton">
                <div className="admin-notif-row__title-skeleton skeleton-shimmer" />
                <div className="admin-notif-row__desc-skeleton skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const hasNotifs = notificationsData && notificationsData.length > 0

  return (
    <div className="admin-list-card admin-glow-card">
      <div className="admin-list-card__header">
        <div className="admin-list-card__title-group">
          <h3 className="admin-list-card__title">Notifications</h3>
          <span className="admin-list-card__subtitle">Administrative security alerts</span>
        </div>
        <Bell size={16} className="admin-notif-header-icon" />
      </div>

      <div className="admin-list-card__body">
        {hasNotifs ? (
          <div className="admin-notif-rows">
            {notificationsData.slice(0, 5).map((notif, idx) => {
              const styles = getLevelStyles(notif.level)
              const Icon = styles.icon
              const isUnread = idx < 2 // mark first two as unread dynamically

              return (
                <div key={notif.id} className={`admin-notif-row ${isUnread ? 'admin-notif-row--unread' : ''}`}>
                  <div className={`admin-notif-row__icon-container ${styles.textClass}`}>
                    <Icon size={13} strokeWidth={2.2} />
                  </div>

                  <div className="admin-notif-row__content">
                    <div className="admin-notif-row__header">
                      <span className="admin-notif-row__title">{notif.title}</span>
                      <div className="admin-notif-row__meta">
                        <span className="admin-notif-row__time">{notif.time}</span>
                        {isUnread && <Circle size={6} fill="var(--admin-accent-indigo)" stroke="none" className="admin-notif-row__unread-dot" />}
                      </div>
                    </div>
                    <span className="admin-notif-row__message">{notif.message}</span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="admin-list-card__empty">No alerts or system notifications.</div>
        )}
      </div>
    </div>
  )
}
