import React, { useState, useEffect, useCallback } from 'react'
import { Mail, AlertCircle, RefreshCw, Search, CheckCircle, XCircle, X, Loader2 } from 'lucide-react'
import { adminEmailLogsService } from '../services/emailLogsService'
import AdminMobileCard from '../components/common/AdminMobileCard'
import './EmailLogs.css'

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'welcome', label: 'Welcome' },
  { value: 'password_reset', label: 'Password Reset' },
  { value: 'admin_password_reset', label: 'Admin Reset' },
  { value: 'feedback_reply', label: 'Feedback Reply' },
  { value: 'admin_notification', label: 'Admin Notification' },
  { value: 'system', label: 'System' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
]

const TYPE_LABELS = {
  welcome: { label: 'Welcome', color: 'blue' },
  password_reset: { label: 'Pwd Reset', color: 'orange' },
  admin_password_reset: { label: 'Admin Reset', color: 'orange' },
  feedback_reply: { label: 'Reply', color: 'purple' },
  admin_notification: { label: 'Notification', color: 'indigo' },
  system: { label: 'System', color: 'gray' },
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function EmailLogs() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [selectedLog, setSelectedLog] = useState(null)


  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await adminEmailLogsService.getEmailLogs({
        status: statusFilter,
        type: typeFilter,
        search,
        date_start: dateStart,
        date_end: dateEnd
      })
      setData(result)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load email logs.')
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, typeFilter, search, dateStart, dateEnd])

  useEffect(() => { fetchData() }, [fetchData])


  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput.trim())
  }

  const logs = data?.logs || []
  const sentCount = data?.sent_count ?? 0
  const failedCount = data?.failed_count ?? 0

  return (
    <div className="emaillogs-page">
      {/* Header */}
      <div className="emaillogs-header">
        <div className="emaillogs-header__left">
          <div className="emaillogs-header__icon">
            <Mail size={22} />
          </div>
          <div>
            <h1 className="emaillogs-header__title">Email Logs</h1>
            <p className="emaillogs-header__sub">Track all platform emails dispatched</p>
          </div>
        </div>
        <button className="emaillogs-refresh-btn" onClick={fetchData} disabled={isLoading} id="emaillogs-refresh-btn">
          <RefreshCw size={14} className={isLoading ? 'el-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary Pills */}
      <div className="emaillogs-summary">
        <div className="emaillogs-summary-pill emaillogs-summary-pill--sent">
          <CheckCircle size={15} />
          <span>{sentCount.toLocaleString()} Sent</span>
        </div>
        <div className="emaillogs-summary-pill emaillogs-summary-pill--failed">
          <XCircle size={15} />
          <span>{failedCount.toLocaleString()} Failed</span>
        </div>
        <div className="emaillogs-summary-pill emaillogs-summary-pill--total">
          <Mail size={15} />
          <span>{(data?.total ?? 0).toLocaleString()} Total</span>
        </div>
      </div>

      {/* Filters */}
      <div className="emaillogs-filters admin-glow-card">
        <form className="emaillogs-search" onSubmit={handleSearch}>
          <div className="emaillogs-search__wrap">
            <Search size={15} className="emaillogs-search__icon" />
            <input
              type="text"
              placeholder="Search by email, subject…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="emaillogs-search__input"
              id="emaillogs-search-input"
            />
          </div>
          <button type="submit" className="emaillogs-search__btn">Search</button>
        </form>
        <div className="emaillogs-filter-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)' }}>From:</span>
            <input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="emaillogs-select"
              style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--admin-border-color)', borderRadius: '6px', color: '#94a3b8' }}
              id="emaillogs-date-start"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)' }}>To:</span>
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="emaillogs-select"
              style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--admin-border-color)', borderRadius: '6px', color: '#94a3b8' }}
              id="emaillogs-date-end"
            />
          </div>

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="emaillogs-select" id="emaillogs-status-filter">
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="emaillogs-select" id="emaillogs-type-filter">
            {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {(statusFilter || typeFilter || search || dateStart || dateEnd) && (
            <button className="emaillogs-clear-btn" onClick={() => { setStatusFilter(''); setTypeFilter(''); setSearch(''); setSearchInput(''); setDateStart(''); setDateEnd('') }}>
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="emaillogs-error">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="emaillogs-table-wrap admin-glow-card">
        {isLoading ? (
          <div className="emaillogs-loading"><Loader2 size={28} className="el-spin" /></div>
        ) : logs.length === 0 ? (
          <div className="emaillogs-empty" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <Mail size={40} style={{ color: 'var(--admin-text-muted)' }} />
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--admin-text-secondary)' }}>No SMTP email records log found. Transactional emails have not been dispatched.</p>
            {(statusFilter || typeFilter || search) && <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>Try adjusting your search filters.</span>}
          </div>
        ) : (
          <>
            <div className="desktop-only-view">
              <table className="emaillogs-table">
                <thead>
                  <tr>
                    <th>Recipient</th>
                    <th>Subject</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Sent At</th>
                    <th>By</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => {
                    const typeInfo = TYPE_LABELS[log.email_type] || { label: log.email_type, color: 'gray' }
                    return (
                      <tr
                        key={log.id}
                        className="emaillogs-table__row emaillogs-table__row--clickable"
                        onClick={() => setSelectedLog(log)}
                      >
                        <td className="emaillogs-td-email">{log.recipient_email}</td>
                        <td className="emaillogs-td-subject">{log.subject}</td>
                        <td>
                          <span className={`emaillogs-badge emaillogs-badge--${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                        </td>
                        <td>
                          <span className={`emaillogs-status emaillogs-status--${log.status}`}>
                            {log.status === 'sent' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                            {log.status}
                          </span>
                        </td>
                        <td className="emaillogs-td-date">{formatDate(log.sent_at)}</td>
                        <td className="emaillogs-td-by">{log.created_by || 'system'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="mobile-only-view emaillogs-cards-mobile" style={{ display: 'none', flexDirection: 'column', gap: '12px' }}>
              {logs.map((log) => {
                const typeInfo = TYPE_LABELS[log.email_type] || { label: log.email_type, color: 'gray' }
                return (
                  <AdminMobileCard
                    key={log.id}
                    title={log.recipient_email || 'No Recipient'}
                    subtitle={log.subject}
                    icon={Mail}
                    badge={
                      <span className={`emaillogs-badge emaillogs-badge--${typeInfo.color}`} style={{ fontSize: '0.65rem' }}>
                        {typeInfo.label}
                      </span>
                    }
                    status={
                      <span className={`emaillogs-status emaillogs-status--${log.status}`} style={{ fontSize: '0.72rem' }}>
                        {log.status}
                      </span>
                    }
                    fields={[
                      { label: 'Sender By', value: log.created_by || 'system' },
                      { label: 'Sent At', value: formatDate(log.sent_at) }
                    ]}
                    actions={[
                      { icon: Mail, label: 'View Detail', onClick: () => setSelectedLog(log) }
                    ]}
                  />
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="emaillogs-modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="emaillogs-modal admin-glow-card" onClick={e => e.stopPropagation()}>
            <div className="emaillogs-modal__header">
              <div className="emaillogs-modal__title">
                <Mail size={18} />
                Email Log Detail
              </div>
              <button className="emaillogs-modal__close" onClick={() => setSelectedLog(null)} id="emaillogs-modal-close">
                <X size={18} />
              </button>
            </div>
            <div className="emaillogs-modal__body">
              <div className="emaillogs-modal__grid">
                <div className="emaillogs-modal__field">
                  <span className="emaillogs-modal__label">Recipient</span>
                  <span className="emaillogs-modal__value">{selectedLog.recipient_email}</span>
                </div>
                <div className="emaillogs-modal__field">
                  <span className="emaillogs-modal__label">Type</span>
                  <span className={`emaillogs-badge emaillogs-badge--${TYPE_LABELS[selectedLog.email_type]?.color || 'gray'}`}>
                    {TYPE_LABELS[selectedLog.email_type]?.label || selectedLog.email_type}
                  </span>
                </div>
                <div className="emaillogs-modal__field">
                  <span className="emaillogs-modal__label">Status</span>
                  <span className={`emaillogs-status emaillogs-status--${selectedLog.status}`}>
                    {selectedLog.status === 'sent' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {selectedLog.status}
                  </span>
                </div>
                <div className="emaillogs-modal__field">
                  <span className="emaillogs-modal__label">Sent At</span>
                  <span className="emaillogs-modal__value">{formatDate(selectedLog.sent_at)}</span>
                </div>
                <div className="emaillogs-modal__field emaillogs-modal__field--full">
                  <span className="emaillogs-modal__label">Subject</span>
                  <span className="emaillogs-modal__value">{selectedLog.subject}</span>
                </div>
                <div className="emaillogs-modal__field">
                  <span className="emaillogs-modal__label">Related User</span>
                  <span className="emaillogs-modal__value">{selectedLog.related_user || '—'}</span>
                </div>
                <div className="emaillogs-modal__field">
                  <span className="emaillogs-modal__label">Triggered By</span>
                  <span className="emaillogs-modal__value">{selectedLog.created_by || 'system'}</span>
                </div>
              </div>
              {selectedLog.status === 'failed' && selectedLog.error_message && (
                <div className="emaillogs-modal__error">
                  <div className="emaillogs-modal__error-title"><XCircle size={14} /> Error Details</div>
                  <pre className="emaillogs-modal__error-body">{selectedLog.error_message}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
