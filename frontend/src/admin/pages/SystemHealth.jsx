import React, { useState, useEffect, useCallback } from 'react'
import { ShieldCheck, ShieldAlert, Shield, RefreshCw, Clock, Cpu, Server, Mail, HardDrive, Terminal } from 'lucide-react'
import { adminSystemHealthService } from '../services/systemHealthService'
import { useAdminRefresh } from '../contexts/RefreshContext'
import './SystemHealth.css'

function formatLatency(latency) {
  if (latency === null || latency === undefined) return '—'
  return `${latency} ms`
}

function getServiceIcon(name) {
  switch (name) {
    case 'backend':
      return <Cpu size={20} />
    case 'database':
      return <Server size={20} />
    case 'email':
      return <Mail size={20} />
    case 'cloudinary':
      return <HardDrive size={20} />
    default:
      return <Terminal size={20} />
  }
}

export default function SystemHealth() {
  const [health, setHealth] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchHealth = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    setError(null)
    try {
      const data = await adminSystemHealthService.getSystemHealth()
      setHealth(data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to check system health diagnostics.')
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHealth(true)
  }, [fetchHealth])

  useAdminRefresh('health', () => {
    fetchHealth(false)
  })

  const services = health?.services || {}
  const uptime = health?.uptime || '—'
  const checkedAt = health?.checked_at
    ? new Date(health.checked_at).toLocaleTimeString()
    : '—'

  return (
    <div className="health-page">
      {/* Header */}
      <div className="health-header">
        <div className="health-header__left">
          <div className="health-header__icon">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="health-header__title">System Health</h1>
            <p className="health-header__sub">Real-time platform latency &amp; status monitoring</p>
          </div>
        </div>
        <button
          className="health-refresh-btn"
          onClick={fetchHealth}
          disabled={isLoading}
          id="health-refresh-btn"
        >
          <RefreshCw size={14} className={isLoading ? 'health-spin' : ''} />
          Run Diagnostics
        </button>
      </div>

      {error && (
        <div className="health-error-banner animate-slide-down">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Info */}
      <div className="health-grid-layout">
        <div className="health-grid-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Status Overview Card */}
          <div className="health-card health-card--overview admin-glow-card">
            <div className="health-card__badge">
              <Shield size={16} />
              <span>Platform Status Overview</span>
            </div>
            <div className="health-overview-value">
              <div 
                className={`health-status-badge health-status-badge--${health?.overall_status?.toLowerCase() || 'healthy'}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  marginBottom: '1rem',
                  textTransform: 'uppercase',
                  background: health?.overall_status === 'Critical' ? 'rgba(239,68,68,0.15)' : health?.overall_status === 'Degraded' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                  color: health?.overall_status === 'Critical' ? '#ef4444' : health?.overall_status === 'Degraded' ? '#f59e0b' : '#10b981',
                }}
              >
                Overall: {health?.overall_status || 'Healthy'}
              </div>
              <div className="health-uptime-pct">{uptime}</div>
              <div className="health-uptime-lbl">Average Uptime</div>
            </div>
            <div className="health-overview-meta">
              <div className="health-meta-item">
                <span className="lbl">API Version</span>
                <span className="val">{health?.api_version || '1.0.0-enterprise'}</span>
              </div>
              <div className="health-meta-item">
                <span className="lbl">Environment</span>
                <span className={`val env-tag ${health?.environment?.toLowerCase() || ''}`}>
                  {health?.environment || 'Production'}
                </span>
              </div>
              <div className="health-meta-item">
                <span className="lbl">Server Time</span>
                <span className="val">
                  {health?.server_time ? new Date(health.server_time).toLocaleTimeString() : '—'}
                </span>
              </div>
              <div className="health-meta-item">
                <span className="lbl">Last Updated</span>
                <span className="val">{checkedAt}</span>
              </div>
            </div>
          </div>

          {/* Neon Database Card */}
          {health?.database_health && (
            <div className="health-card service-card service-card--operational admin-glow-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="service-card__header">
                <div className="service-card__icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                  <Server size={20} />
                </div>
                <div className="service-card__title-group">
                  <span className="service-card__label">{health.database_health.provider}</span>
                  <span className="service-card__key" style={{ wordBreak: 'break-all' }}>host: {health.database_health.host}</span>
                </div>
                <span className={`service-status-pill ${health.database_health.status === 'Operational' ? 'status-operational' : 'status-offline'}`}>
                  {health.database_health.status}
                </span>
              </div>
              <div className="service-card__body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px 15px', border: 'none', padding: '0', background: 'transparent' }}>
                <div className="db-health-item" style={{ minWidth: '0' }}>
                  <span className="lbl" style={{ display: 'block', fontSize: '0.7rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Database</span>
                  <span className="val" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={health.database_health.database}>{health.database_health.database}</span>
                </div>
                <div className="db-health-item">
                  <span className="lbl" style={{ display: 'block', fontSize: '0.7rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Connection</span>
                  <span className="val" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-text-primary)' }}>{health.database_health.connection}</span>
                </div>
                <div className="db-health-item">
                  <span className="lbl" style={{ display: 'block', fontSize: '0.7rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SSL Status</span>
                  <span className="val" style={{ 
                    display: 'block', 
                    fontSize: '0.85rem', 
                    fontWeight: 600, 
                    color: health.database_health.ssl === 'Enabled' ? '#10b981' : health.database_health.ssl === 'Disabled' ? '#f59e0b' : 'var(--admin-text-muted)' 
                  }}>{health.database_health.ssl}</span>
                </div>
                <div className="db-health-item">
                  <span className="lbl" style={{ display: 'block', fontSize: '0.7rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Latency</span>
                  <span className="val" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-text-primary)' }}>{formatLatency(health.database_health.latency_ms)}</span>
                </div>
                <div className="db-health-item" style={{ gridColumn: 'span 2', minWidth: '0' }}>
                  <span className="lbl" style={{ display: 'block', fontSize: '0.7rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Engine Version</span>
                  <span className="val" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={health.database_health.version}>{health.database_health.version}</span>
                </div>
                <div className="db-health-item" style={{ gridColumn: 'span 2', minWidth: '0' }}>
                  <span className="lbl" style={{ display: 'block', fontSize: '0.7rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Successful Query</span>
                  <span className="val" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--admin-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={health.database_health.last_successful_query}>
                    {health.database_health.last_successful_query !== 'Unavailable' ? new Date(health.database_health.last_successful_query).toLocaleString() : 'Unavailable'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Critical Services Section */}
        <h3 className="services-section-title" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--admin-text-primary)', margin: '1.5rem 0 1rem', borderLeft: '3px solid var(--admin-accent-purple)', paddingLeft: '8px' }}>Critical Services</h3>
        <div className="health-grid">
          {['backend', 'database'].map(key => {
            const service = services[key]
            if (!service) return null
            const statusLower = service.status?.toLowerCase()
            return (
              <div key={key} className={`health-card service-card service-card--${statusLower} admin-glow-card`}>
                <div className="service-card__header">
                  <div className="service-card__icon">{getServiceIcon(key)}</div>
                  <div className="service-card__title-group">
                    <span className="service-card__label">{service.label}</span>
                    <span className="service-card__key">service: {key}</span>
                  </div>
                  <span className={`service-status-pill status-${statusLower}`}>
                    {service.status}
                  </span>
                </div>
                <div className="service-card__body">
                  <div className="latency-info">
                    <span className="latency-lbl">Response Latency</span>
                    <span className="latency-val">{formatLatency(service.latency_ms)}</span>
                  </div>
                  <div className="service-indicator-bar">
                    <div className="service-indicator-fill" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Optional Services Section */}
        <h3 className="services-section-title" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--admin-text-primary)', margin: '2rem 0 1rem', borderLeft: '3px solid var(--admin-accent-purple)', paddingLeft: '8px' }}>Optional Services</h3>
        <div className="health-grid">
          {['email', 'cloudinary'].map(key => {
            const service = services[key]
            if (!service) return null
            const statusLower = service.status?.toLowerCase()
            return (
              <div key={key} className={`health-card service-card service-card--${statusLower} admin-glow-card`}>
                <div className="service-card__header">
                  <div className="service-card__icon">{getServiceIcon(key)}</div>
                  <div className="service-card__title-group">
                    <span className="service-card__label">{service.label}</span>
                    <span className="service-card__key">service: {key}</span>
                  </div>
                  <span className={`service-status-pill status-${statusLower}`}>
                    {service.status}
                  </span>
                </div>
                <div className="service-card__body">
                  <div className="latency-info">
                    <span className="latency-lbl">Response Latency</span>
                    <span className="latency-val">{formatLatency(service.latency_ms)}</span>
                  </div>
                  <div className="service-indicator-bar">
                    <div className="service-indicator-fill" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
