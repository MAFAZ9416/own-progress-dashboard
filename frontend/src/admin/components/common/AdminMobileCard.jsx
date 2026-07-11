import React from 'react'
import './AdminMobileCard.css'

export default function AdminMobileCard({
  avatar,
  icon: IconComponent,
  title,
  subtitle,
  badge,
  fields = [],
  status,
  actions = [],
}) {
  return (
    <div className="admin-mobile-card admin-glow-card">
      {/* Header section */}
      <div className="mobile-card-header">
        <div className="mobile-card-header__left">
          {avatar && (
            <div className="mobile-card-avatar">
              <img src={avatar} alt="avatar" onError={(e) => { e.target.style.display = 'none' }} />
            </div>
          )}
          {IconComponent && !avatar && (
            <div className="mobile-card-icon">
              <IconComponent size={14} />
            </div>
          )}
          <div className="mobile-card-title-group">
            <h4 className="mobile-card-title">{title}</h4>
            {subtitle && <span className="mobile-card-subtitle">{subtitle}</span>}
          </div>
        </div>
        {(badge || status) && (
          <div className="mobile-card-header__right">
            {badge && <span className="mobile-card-badge">{badge}</span>}
            {status && <div className="mobile-card-status">{status}</div>}
          </div>
        )}
      </div>

      {/* Body section (fields) */}
      {fields.length > 0 && (
        <div className="mobile-card-body">
          {fields.map((field, idx) => (
            <div key={idx} className="mobile-card-row">
              <span className="mobile-card-label">{field.label}</span>
              <span className="mobile-card-value">{field.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer section (actions) */}
      {actions.length > 0 && (
        <div className="mobile-card-actions">
          {actions.map((action, idx) => {
            const ActIcon = action.icon
            return (
              <button
                key={idx}
                onClick={action.onClick}
                className={`mobile-action-btn ${action.className || ''}`}
                title={action.title || action.label}
                disabled={action.disabled}
              >
                {ActIcon && <ActIcon size={13} className="action-btn-icon" />}
                {action.label && <span>{action.label}</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
