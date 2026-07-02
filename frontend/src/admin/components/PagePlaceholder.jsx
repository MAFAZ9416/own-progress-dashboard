import React from 'react'
import './PagePlaceholder.css'

export default function PagePlaceholder({ title, icon: Icon, phaseText }) {
  return (
    <div className="admin-placeholder">
      {/* Breadcrumb Indicator */}
      <div className="admin-placeholder__breadcrumbs">
        <span className="admin-placeholder__breadcrumb-item">Home</span>
        <span className="admin-placeholder__breadcrumb-divider">/</span>
        <span className="admin-placeholder__breadcrumb-item admin-placeholder__breadcrumb-item--active">
          {title}
        </span>
      </div>

      {/* Page Title */}
      <h1 className="admin-placeholder__title">{title}</h1>

      {/* Visual Premium Content Card Placeholder */}
      <div className="admin-placeholder__card admin-glow-card">
        <div className="admin-placeholder__icon-container">
          {Icon && <Icon size={40} strokeWidth={1.5} className="admin-placeholder__icon" />}
        </div>
        
        <h2 className="admin-placeholder__card-title">
          {title} Module
        </h2>
        
        <p className="admin-placeholder__card-description">
          The Enterprise Admin Layout for this workspace section is ready. {phaseText}
        </p>

        <div className="admin-placeholder__badge">
          <span className="admin-placeholder__badge-dot"></span>
          <span className="admin-placeholder__badge-text">Phase 1.1 Layout Verified</span>
        </div>
      </div>
    </div>
  )
}
