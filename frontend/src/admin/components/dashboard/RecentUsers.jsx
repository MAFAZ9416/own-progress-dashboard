import React from 'react'
import './RecentUsers.css'

export default function RecentUsers({ users = [], isLoading, onViewAll }) {
  
  // Format initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name[0].toUpperCase()
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
            <div key={i} className="admin-user-row admin-user-row--skeleton">
              <div className="admin-user-row__avatar-skeleton skeleton-shimmer" />
              <div className="admin-user-row__info-skeleton">
                <div className="admin-user-row__name-skeleton skeleton-shimmer" />
                <div className="admin-user-row__email-skeleton skeleton-shimmer" />
              </div>
              <div className="admin-user-row__status-skeleton skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const hasUsers = users && users.length > 0

  return (
    <div className="admin-list-card admin-glow-card">
      <div className="admin-list-card__header">
        <div className="admin-list-card__title-group">
          <h3 className="admin-list-card__title">Recent Users</h3>
          <span className="admin-list-card__subtitle">Latest signups</span>
        </div>
        {hasUsers && (
          <button 
            onClick={onViewAll} 
            className="admin-list-card__action-link"
            id="admin-recent-users-view-all"
          >
            View All
          </button>
        )}
      </div>

      <div className="admin-list-card__body">
        {hasUsers ? (
          <div className="admin-list-card__rows">
            {users.slice(0, 5).map((user) => (
              <div key={user.id || user.email} className="admin-user-row">
                <div className="admin-user-row__avatar-container">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="admin-user-row__avatar"
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  ) : (
                    <div className="admin-user-row__avatar-fallback">
                      {getInitials(user.name)}
                    </div>
                  )}
                </div>
                
                <div className="admin-user-row__info">
                  <span className="admin-user-row__name">{user.name}</span>
                  <span className="admin-user-row__email">{user.email}</span>
                </div>

                <div className="admin-user-row__status">
                  <span className={`admin-user-row__badge admin-user-row__badge--${user.status.toLowerCase()}`}>
                    {user.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-list-card__empty">No recent users found.</div>
        )}
      </div>
    </div>
  )
}
