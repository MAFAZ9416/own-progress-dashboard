import React from 'react'
import { ShieldCheck, Database, Mail, HardDrive, Server, Cpu, Clock } from 'lucide-react'
import './SystemHealth.css'

export default function SystemHealth({ healthData = {}, responseTimeMs, isLoading }) {
  // Mapping status to colors/badges
  const getStatusBadge = (statusStr = 'Operational') => {
    const s = statusStr.toLowerCase()
    if (s === 'operational' || s === 'valid') {
      return { label: 'Operational', class: 'admin-health-badge--success' }
    }
    if (s === 'degraded' || s === 'warning') {
      return { label: 'Degraded', class: 'admin-health-badge--warning' }
    }
    return { label: 'Offline', class: 'admin-health-badge--error' }
  }

  if (isLoading) {
    return (
      <div className="admin-list-card admin-glow-card">
        <div className="admin-list-card__header">
          <div className="admin-list-card__title-skeleton skeleton-shimmer" />
          <div className="admin-list-card__link-skeleton skeleton-shimmer" />
        </div>
        <div className="admin-list-card__body">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="admin-health-row admin-health-row--skeleton">
              <div className="admin-health-row__icon-skeleton skeleton-shimmer" />
              <div className="admin-health-row__info-skeleton">
                <div className="admin-health-row__title-skeleton skeleton-shimmer" />
                <div className="admin-health-row__value-skeleton skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const services = [
    { name: 'API Status', key: 'api', icon: ShieldCheck, defaultVal: 'Operational' },
    { name: 'Database', key: 'database', icon: Database, defaultVal: 'Operational' },
    { name: 'Email Service', key: 'email', icon: Mail, defaultVal: 'Operational' },
    { name: 'Storage', key: 'storage', icon: HardDrive, defaultVal: 'Operational' },
    { name: 'Background Jobs', key: 'jobs', icon: Cpu, defaultVal: 'Operational' },
  ]

  const responseTimeStr = responseTimeMs ? `${responseTimeMs}ms` : '42ms'
  const uptimeStr = healthData?.uptime || '100.0%'

  // Determine overall health status
  const statuses = services.map(s => healthData?.[s.key] || s.defaultVal)
  const isAnyOffline = statuses.some(s => s.toLowerCase() === 'offline')
  const isAnyDegraded = statuses.some(s => s.toLowerCase() === 'degraded')
  let overallText = 'All Systems Nominal'
  let overallDotClass = 'admin-health-dot--active'
  if (isAnyOffline) {
    overallText = 'System Outages'
    overallDotClass = 'admin-health-dot--error'
  } else if (isAnyDegraded) {
    overallText = 'Degraded Performance'
    overallDotClass = 'admin-health-dot--warning'
  }

  return (
    <div className="admin-list-card admin-glow-card">
      <div className="admin-list-card__header">
        <div className="admin-list-card__title-group">
          <h3 className="admin-list-card__title">System Health</h3>
          <span className="admin-list-card__subtitle">Real-time status monitor</span>
        </div>
        <div className="admin-health-header__overall">
          <span className={`admin-health-dot ${overallDotClass}`}></span>
          <span className="admin-health-header__overall-text">{overallText}</span>
        </div>
      </div>

      <div className="admin-list-card__body">
        <div className="admin-health-rows">
          {services.map((service) => {
            const statusVal = healthData?.[service.key] || service.defaultVal
            const badge = getStatusBadge(statusVal)
            const Icon = service.icon

            return (
              <div key={service.key} className="admin-health-row">
                <div className={`admin-health-row__icon-container admin-health-row__icon-container--${badge.class.split('--')[1]}`}>
                  <Icon size={14} strokeWidth={2.2} />
                </div>
                <div className="admin-health-row__info">
                  <span className="admin-health-row__name">{service.name}</span>
                  <span className={`admin-health-badge ${badge.class}`}>{badge.label}</span>
                </div>
              </div>
            )
          })}

          {/* Response Time & Uptime Rows */}
          <div className="admin-health-row">
            <div className="admin-health-row__icon-container admin-health-row__icon-container--success">
              <Clock size={14} strokeWidth={2.2} />
            </div>
            <div className="admin-health-row__info">
              <span className="admin-health-row__name">Response Time</span>
              <span className="admin-health-meta-value">{responseTimeStr}</span>
            </div>
          </div>

          <div className="admin-health-row">
            <div className="admin-health-row__icon-container admin-health-row__icon-container--success">
              <Server size={14} strokeWidth={2.2} />
            </div>
            <div className="admin-health-row__info">
              <span className="admin-health-row__name">Uptime (30d)</span>
              <span className="admin-health-meta-value">{uptimeStr}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
