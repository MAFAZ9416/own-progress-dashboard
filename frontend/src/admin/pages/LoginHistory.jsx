import React, { useState, useEffect, useCallback } from 'react'
import { ShieldCheck, Monitor, HelpCircle, RefreshCw, AlertCircle, Clock, MapPin, Cpu, Search, Calendar, Filter } from 'lucide-react'
import loginHistoryService from '../../services/loginHistoryService'
import AdminMobileCard from '../components/common/AdminMobileCard'
import './LoginHistory.css'

export default function LoginHistory() {
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters State
  const [search, setSearch] = useState('')
  const [browser, setBrowser] = useState('all')
  const [statusParam, setStatusParam] = useState('all')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')

  const fetchHistory = useCallback(async (isInitial = true) => {
    if (isInitial) setIsLoading(true)
    setError(null)
    try {
      const params = {}
      if (search.trim()) params.search = search.trim()
      if (browser !== 'all') params.browser = browser
      if (statusParam !== 'all') params.status = statusParam
      if (dateStart) params.date_start = dateStart
      if (dateEnd) params.date_end = dateEnd

      const data = await loginHistoryService.getLoginHistory(params)
      setHistory(data || [])
    } catch (err) {
      console.error('Failed to load login history:', err)
      setError('Failed to fetch admin security credentials history.')
    } finally {
      setIsLoading(false)
    }
  }, [search, browser, statusParam, dateStart, dateEnd])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchHistory(true)
    }, 400)
    return () => clearTimeout(delayDebounceFn)
  }, [search, browser, statusParam, dateStart, dateEnd, fetchHistory])

  const handleResetFilters = () => {
    setSearch('')
    setBrowser('all')
    setStatusParam('all')
    setDateStart('')
    setDateEnd('')
  }

  return (
    <div className="loginhistory-page">
      {/* Header */}
      <div className="loginhistory-header">
        <div className="loginhistory-header__left">
          <div className="loginhistory-header__icon">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="loginhistory-header__title">Security History</h1>
            <p className="loginhistory-header__sub">
              Monitor active logins, device types, browser clients, and authorization states for your profile
            </p>
          </div>
        </div>
        <button 
          className="loginhistory-refresh-btn" 
          onClick={() => fetchHistory(true)} 
          disabled={isLoading}
          id="loginhistory-refresh-btn"
        >
          <RefreshCw size={14} className={isLoading ? 'loginhistory-spin' : ''} />
          Refresh Registry
        </button>
      </div>

      {/* Advanced Filters Panel */}
      <div className="loginhistory-filters-bar admin-glow-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem', marginBottom: '1.5rem', borderRadius: '12px', border: '1px solid var(--admin-border-color)' }}>
        <div className="filters-row-main" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="filter-input-group" style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
            <input
              type="text"
              placeholder="Search IP, Device, OS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.2rem', borderRadius: '8px', border: '1px solid var(--admin-border-color)', background: 'rgba(255,255,255,0.02)', color: 'var(--admin-text-primary)', fontSize: '0.8125rem' }}
            />
          </div>

          <div className="filter-input-group">
            <select
              value={browser}
              onChange={(e) => setBrowser(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--admin-border-color)', background: 'rgba(255,255,255,0.02)', color: 'var(--admin-text-primary)', fontSize: '0.8125rem', outline: 'none' }}
            >
              <option value="all">All Browsers</option>
              <option value="chrome">Chrome</option>
              <option value="firefox">Firefox</option>
              <option value="safari">Safari</option>
              <option value="edge">Edge</option>
              <option value="other">Other Client</option>
            </select>
          </div>

          <div className="filter-input-group">
            <select
              value={statusParam}
              onChange={(e) => setStatusParam(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--admin-border-color)', background: 'rgba(255,255,255,0.02)', color: 'var(--admin-text-primary)', fontSize: '0.8125rem', outline: 'none' }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Sessions</option>
              <option value="expired">Expired Sessions</option>
            </select>
          </div>
        </div>

        <div className="filters-row-date" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={14} style={{ color: 'var(--admin-text-muted)' }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-secondary)' }}>From</span>
            <input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--admin-border-color)', background: 'rgba(255,255,255,0.02)', color: 'var(--admin-text-primary)', fontSize: '0.78rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-secondary)' }}>To</span>
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--admin-border-color)', background: 'rgba(255,255,255,0.02)', color: 'var(--admin-text-primary)', fontSize: '0.78rem' }}
            />
          </div>

          {(search || browser !== 'all' || statusParam !== 'all' || dateStart || dateEnd) && (
            <button 
              onClick={handleResetFilters}
              style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', color: 'var(--admin-accent-purple)', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '6px', cursor: 'pointer' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="loginhistory-error">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {isLoading && history.length === 0 ? (
        <div className="loginhistory-loading">
          <div className="spinner"></div>
          <p>Compiling device security register...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="loginhistory-empty-state" style={{ padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', background: 'var(--admin-surface-translucent)', border: '1px solid var(--admin-border-color)', borderRadius: '12px' }}>
          <Monitor className="empty-icon" size={40} style={{ color: 'var(--admin-text-muted)' }} />
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--admin-text-secondary)' }}>No security login logs recorded matching the criteria. Try adjusting filters.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="loginhistory-table-card admin-glow-card desktop-only-view">
            <div className="loginhistory-table-header">
              <Cpu size={16} />
              <h3>Authorized Device Sessions</h3>
              <span className="loginhistory-badge">{history.length} events logged</span>
            </div>
            
            <div className="loginhistory-table-wrap">
              <table className="loginhistory-table">
                <thead>
                  <tr>
                    <th>Device / OS</th>
                    <th>Client Browser</th>
                    <th>IP Address</th>
                    <th>Login Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((record, index) => {
                    const isCurrentSession = record.is_active && index === 0
                    return (
                      <tr key={record.id} className={isCurrentSession ? 'loginhistory-tr--current' : ''}>
                        <td className="loginhistory-td-device">
                          <Monitor size={14} className="cell-icon" />
                          <div>
                            <div className="val-main">{record.device || 'Unknown Device'}</div>
                            <div className="val-sub">{record.os || 'Unknown OS'}</div>
                          </div>
                        </td>
                        <td className="loginhistory-td-browser">
                          <Cpu size={14} className="cell-icon" />
                          <span>{record.browser || 'Unknown Client'}</span>
                        </td>
                        <td className="loginhistory-td-ip">
                          <MapPin size={14} className="cell-icon" />
                          <span>{record.ip_address || '—'}</span>
                        </td>
                        <td className="loginhistory-td-time">
                          <Clock size={14} className="cell-icon" />
                          <span>{new Date(record.created_at).toLocaleString()}</span>
                        </td>
                        <td>
                          {isCurrentSession ? (
                            <span className="status-pill status-active loginhistory-pill-current">
                              Current Session
                            </span>
                          ) : record.is_active ? (
                            <span className="status-pill status-active">
                              Active
                            </span>
                          ) : (
                            <span className="status-pill status-inactive">
                              Expired
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List View */}
          <div className="loginhistory-mobile-list mobile-only-view" style={{ display: 'none', flexDirection: 'column', gap: '12px' }}>
            {history.map((record, index) => {
              const isCurrentSession = record.is_active && index === 0
              return (
                <AdminMobileCard
                  key={record.id}
                  title={record.device || 'Unknown Device'}
                  subtitle={record.os || 'Unknown OS'}
                  icon={Monitor}
                  badge={
                    isCurrentSession ? (
                      <span className="status-pill status-active loginhistory-pill-current" style={{ fontSize: '0.65rem' }}>Current Session</span>
                    ) : record.is_active ? (
                      <span className="status-pill status-active" style={{ fontSize: '0.65rem' }}>Active</span>
                    ) : (
                      <span className="status-pill status-inactive" style={{ fontSize: '0.65rem' }}>Expired</span>
                    )
                  }
                  fields={[
                    { label: 'Client Browser', value: record.browser || 'Unknown Client' },
                    { label: 'IP Address', value: record.ip_address || '—' },
                    { label: 'Login Time', value: new Date(record.created_at).toLocaleString() }
                  ]}
                />
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
