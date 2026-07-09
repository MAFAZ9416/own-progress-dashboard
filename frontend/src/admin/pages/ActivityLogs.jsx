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
  Activity
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
  const [logType, setLogType] = useState('all') // 'all', 'admin', 'user' (user is simulated on backend filters)

  // Fetch logs
  const fetchLogs = useCallback(async (isInitial = true) => {
    if (isInitial) setIsLoading(true)
    setError(null)
    try {
      const params = {
        user: searchUser.trim(),
        type: logType
      }
      const data = await adminActivityService.getActivityLogs(params)
      setLogs(data.logs || [])
    } catch (err) {
      console.error('Error fetching activity logs:', err)
      setError('Failed to load activity logs.')
    } finally {
      setIsLoading(false)
    }
  }, [searchUser, logType])

  useEffect(() => {
    fetchLogs(true)
  }, [searchUser, logType, fetchLogs])

  // Badge helper
  const getLogBadge = (type) => {
    if (type === 'admin') {
      return (
        <span className="log-badge admin">
          <ShieldAlert className="badge-inline-icon" />
          Admin
        </span>
      )
    }
    return (
      <span className="log-badge user">
        <Activity className="badge-inline-icon" />
        User Event
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
          />
        </div>

        <div className="filters-group">
          <div className="filter-item">
            <Filter className="filter-icon" />
            <select value={logType} onChange={(e) => setLogType(e.target.value)}>
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
        {isLoading ? (
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
                <tr key={log.id}>
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
        )}
      </div>
    </div>
  )
}
