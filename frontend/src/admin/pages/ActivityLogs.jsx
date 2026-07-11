import React, { useState, useEffect, useCallback } from 'react'
import { 
  History, 
  Search, 
  Filter, 
  AlertCircle, 
  Clock, 
  User, 
  ShieldAlert, 
  ShieldCheck,
  Activity,
  X,
  FileText
} from 'lucide-react'
import { adminActivityService } from '../services/activityService'
import './ActivityLogs.css'

export default function ActivityLogs() {
  // Data state
  const [logs, setLogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [searchUser, setSearchUser] = useState('')
  const [logType, setLogType] = useState('all')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')

  // Selected Log for detail modal
  const [selectedLog, setSelectedLog] = useState(null)

  // Fetch logs
  const fetchLogs = useCallback(async (isInitial = true) => {
    if (isInitial) setIsLoading(true)
    setError(null)
    try {
      const params = {
        user: searchUser.trim(),
        type: logType,
        date_start: dateStart,
        date_end: dateEnd
      }
      const data = await adminActivityService.getActivityLogs(params)
      setLogs(data.logs || [])
    } catch (err) {
      console.error('Error fetching activity logs:', err)
      setError('Failed to load activity logs.')
    } finally {
      setIsLoading(false)
    }
  }, [searchUser, logType, dateStart, dateEnd])

  useEffect(() => {
    fetchLogs(true)
  }, [searchUser, logType, dateStart, dateEnd, fetchLogs])

  // Badge helper
  const getLogBadge = (type) => {
    if (type === 'admin') {
      return (
        <span className="log-badge admin">
          <ShieldAlert className="badge-inline-icon" />
          Admin Action
        </span>
      )
    }
    return (
      <span className="log-badge user">
        <Activity className="badge-inline-icon" />
        {type?.replace('_', ' ') || 'User Event'}
      </span>
    )
  }

  return (
    <div className="admin-activity-container">
      {/* Header section */}
      <div className="admin-activity-header">
        <div className="header-left">
          <div className="header-icon-wrapper">
            <History className="header-icon" />
          </div>
          <div>
            <h1 className="admin-activity-title">Activity Logs</h1>
            <p className="admin-activity-subtitle">Audit trails of administrative updates and student-side learning activities</p>
          </div>
        </div>
      </div>

      {/* Filter and controls bar */}
      <div className="admin-activity-filter-bar admin-glow-card">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search by username..."
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            id="activity-search-input"
          />
        </div>

        <div className="filters-group">
          <div className="filter-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)' }}>From:</span>
            <input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="admin-users-select"
              style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--admin-border-color)', borderRadius: '6px', color: '#94a3b8' }}
              id="activity-date-start"
            />
          </div>
          <div className="filter-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)' }}>To:</span>
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="admin-users-select"
              style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--admin-border-color)', borderRadius: '6px', color: '#94a3b8' }}
              id="activity-date-end"
            />
          </div>

          <div className="filter-item">
            <Filter className="filter-icon" />
            <select value={logType} onChange={(e) => setLogType(e.target.value)} id="activity-type-select">
              <option value="all">All Activities</option>
              <option value="admin">Admin Actions Only</option>
              <option value="user">User Events Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      {error && (
        <div className="admin-activity-error-alert">
          <AlertCircle className="error-alert-icon" />
          <span>{error}</span>
        </div>
      )}

      <div className="admin-activity-table-wrapper admin-glow-card">
        {isLoading && logs.length === 0 ? (
          <div className="admin-activity-loading">
            <div className="spinner"></div>
            <p>Compiling activity audit trail...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="admin-activity-empty-state">
            <History className="empty-icon" />
            <h3>No Logs Found</h3>
            <p>No matches in the active logs dataset.</p>
          </div>
        ) : (
          <div className="activity-responsive-container">
            <table className="admin-activity-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Source</th>
                  <th>Action details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr 
                    key={log.id} 
                    className="admin-activity-tr--clickable"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td>
                      <div className="time-cell">
                        <Clock className="time-icon" />
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </td>
                    <td>
                      <div className="actor-cell">
                        <User className="actor-icon" />
                        <span className="actor-username">{log.username || 'System'}</span>
                      </div>
                    </td>
                    <td>{getLogBadge(log.type)}</td>
                    <td>
                      <span className="action-text">{log.action || log.message}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile View - Cards */}
            <div className="activity-cards-mobile">
              {logs.map((log) => (
                <div 
                  key={log.id} 
                  className="activity-mobile-card"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="mobile-card-row mobile-card-header">
                    <div className="actor-cell">
                      <User className="actor-icon" />
                      <span className="actor-username">{log.username || 'System'}</span>
                    </div>
                    {getLogBadge(log.type)}
                  </div>
                  <div className="mobile-card-details">
                    <p className="action-text">{log.action || log.message}</p>
                  </div>
                  <div className="mobile-card-row footer-time">
                    <Clock size={12} />
                    <span>{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="emaillogs-modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="activity-detail-modal admin-glow-card" onClick={e => e.stopPropagation()}>
            <div className="emaillogs-modal__header">
              <div className="emaillogs-modal__title">
                <FileText size={18} className="icon-purple" />
                Audit Trail Log Details
              </div>
              <button className="emaillogs-modal__close" onClick={() => setSelectedLog(null)} id="activity-detail-close">
                <X size={18} />
              </button>
            </div>
            <div className="emaillogs-modal__body">
              <div className="activity-detail-grid">
                <div className="activity-detail-field">
                  <span className="lbl">System Actor</span>
                  <span className="val">@{selectedLog.username || 'system'}</span>
                </div>
                <div className="activity-detail-field">
                  <span className="lbl">Event Source</span>
                  <span className="val">{selectedLog.type === 'admin' ? 'Administrative Action' : 'User Lifecycle/Learning Event'}</span>
                </div>
                <div className="activity-detail-field">
                  <span className="lbl">Event Target</span>
                  <span className="val">{selectedLog.target || 'System'}</span>
                </div>
                <div className="activity-detail-field">
                  <span className="lbl">Log Timestamp</span>
                  <span className="val">{new Date(selectedLog.created_at).toLocaleString()}</span>
                </div>
                <div className="activity-detail-field activity-detail-field--full">
                  <span className="lbl">Action Performed</span>
                  <div className="action-content-box">
                    {selectedLog.action || selectedLog.message}
                  </div>
                </div>

                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div className="activity-detail-field activity-detail-field--full">
                    <span className="lbl">Structured Metadata</span>
                    <div className="metadata-structured-box" style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--admin-border-color)' }}>
                      {Object.entries(selectedLog.metadata).map(([key, val]) => (
                        <div key={key} className="metadata-kv-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8125rem' }}>
                          <strong style={{ color: 'var(--admin-text-secondary)', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}:</strong>
                          <span style={{ color: 'var(--admin-text-primary)' }}>
                            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

