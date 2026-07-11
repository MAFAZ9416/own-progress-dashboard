import React, { useState, useEffect, useCallback } from 'react'
import { ShieldCheck, Monitor, HelpCircle, RefreshCw, AlertCircle, Clock, MapPin, Cpu } from 'lucide-react'
import loginHistoryService from '../../services/loginHistoryService'
import './LoginHistory.css'

export default function LoginHistory() {
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchHistory = useCallback(async (isInitial = true) => {
    if (isInitial) setIsLoading(true)
    setError(null)
    try {
      const data = await loginHistoryService.getLoginHistory()
      setHistory(data || [])
    } catch (err) {
      console.error('Failed to load login history:', err)
      setError('Failed to fetch admin security log.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHistory(true)
  }, [fetchHistory])

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
        <div className="loginhistory-empty-state">
          <Monitor className="empty-icon" />
          <p>No historical security records compiled yet.</p>
        </div>
      ) : (
        <div className="loginhistory-table-card admin-glow-card">
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
                  // The first active record (or index 0 since list is sorted by created_at desc) is the current session
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
      )}
    </div>
  )
}
