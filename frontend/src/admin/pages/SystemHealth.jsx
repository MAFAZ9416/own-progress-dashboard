import React, { useState, useEffect, useCallback } from 'react'
import { ShieldCheck, ShieldAlert, Shield, RefreshCw, Clock, Cpu, Server, Mail, HardDrive, Terminal } from 'lucide-react'
import { adminSystemHealthService } from '../services/systemHealthService'
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

  const fetchHealth = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await adminSystemHealthService.getSystemHealth()
      setHealth(data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to check system health diagnostics.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHealth()
  }, [fetchHealth])

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
      <div className="health-grid">
        {/* Status Overview Card */}
        <div className="health-card health-card--overview admin-glow-card">
          <div className="health-card__badge">
            <Shield size={16} />
            <span>Platform Status</span>
          </div>
          <div className="health-overview-value">
            <span className="health-uptime-pct">{uptime}</span>
            <span className="health-uptime-lbl">Average Uptime</span>
          </div>
          <div className="health-overview-meta">
            <div className="health-meta-item">
              <span className="lbl">API Version</span>
              <span className="val">{health?.api_version || '—'}</span>
            </div>
            <div className="health-meta-item">
              <span className="lbl">Environment</span>
              <span className={`val env-tag ${health?.environment?.toLowerCase() || ''}`}>
                {health?.environment || '—'}
              </span>
            </div>
            <div className="health-meta-item">
              <span className="lbl">Server Time</span>
              <span className="val">
                {health?.server_time ? new Date(health.server_time).toLocaleTimeString() : '—'}
              </span>
            </div>
            <div className="health-meta-item">
              <span className="lbl">Last Inspected</span>
              <span className="val">{checkedAt}</span>
            </div>
          </div>
        </div>

        {/* Services Status Cards */}
        {Object.entries(services).map(([key, service]) => {
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
  )
}
