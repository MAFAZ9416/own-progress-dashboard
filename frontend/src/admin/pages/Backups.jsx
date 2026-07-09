import React, { useState, useEffect, useCallback } from 'react'
import { HardDrive, RefreshCw, Plus, Download, AlertCircle, CheckCircle2, Clock, Trash, Loader2, FileJson, ShieldAlert, X } from 'lucide-react'
import { adminBackupsService } from '../services/backupsService'
import { apiClient } from '../../api'
import './Backups.css'

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function Backups() {
  const [backups, setBackups] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modals / Actions state
  const [showConfirm, setShowConfirm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)
  const [toast, setToast] = useState(null) // { type: 'success'|'error', msg: string }

  const fetchBackupsList = useCallback(async (isInitial = true) => {
    if (isInitial) setIsLoading(true)
    setError(null)
    try {
      const data = await adminBackupsService.getBackups()
      setBackups(data.backups || [])
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to fetch database backups list.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBackupsList(true)
  }, [fetchBackupsList])

  const triggerToast = (type, msg) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 5000)
  }

  // Create Backup flow
  const handleCreateBackup = async () => {
    setShowConfirm(false)
    setIsCreating(true)
    try {
      const result = await adminBackupsService.createBackup()
      triggerToast('success', result.message || 'Database snapshot created successfully.')
      fetchBackupsList(false)
    } catch (err) {
      triggerToast('error', err.response?.data?.detail || err.message || 'Database backup execution failed.')
    } finally {
      setIsCreating(false)
    }
  }

  // Safe Download backup flow (through admin authenticated endpoint)
  const handleDownload = async (backup) => {
    if (downloadingId) return
    setDownloadingId(backup.id)
    try {
      // Secure call with authentication headers injected by apiClient
      const response = await apiClient.get(`/admin/backups/${backup.id}/download/`, {
        responseType: 'blob',
      })

      // Standard safe browser blob download
      const blob = new Blob([response.data], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = backup.file_name
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      triggerToast('success', `File '${backup.file_name}' downloaded.`)
    } catch (err) {
      triggerToast('error', 'Backup download failed. Please try again.')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="backups-page">
      {/* Header */}
      <div className="backups-header">
        <div className="backups-header__left">
          <div className="backups-header__icon">
            <HardDrive size={22} />
          </div>
          <div>
            <h1 className="backups-header__title">Backups Center</h1>
            <p className="backups-header__sub">Create and download secure snapshots of users, skills, and progress data</p>
          </div>
        </div>
        <div className="backups-header__actions">
          <button
            className="backups-btn backups-btn--secondary"
            onClick={() => fetchBackupsList(true)}
            disabled={isLoading || isCreating}
            id="backups-refresh-btn"
          >
            <RefreshCw size={14} className={isLoading ? 'backups-spin' : ''} />
          </button>
          <button
            className="backups-btn backups-btn--primary"
            onClick={() => setShowConfirm(true)}
            disabled={isLoading || isCreating}
            id="backups-create-btn"
          >
            {isCreating ? (
              <>
                <Loader2 size={14} className="backups-spin" />
                Snapshotting...
              </>
            ) : (
              <>
                <Plus size={14} />
                Create Safe Backup
              </>
            )}
          </button>
        </div>
      </div>

      {toast && (
        <div className={`backups-toast backups-toast--${toast.type} animate-slide-down`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="backups-toast__close">
            <X size={14} />
          </button>
        </div>
      )}

      {error && (
        <div className="backups-error-alert animate-slide-down">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Main List */}
      <div className="backups-card admin-glow-card">
        <div className="backups-card__header">
          <FileJson size={18} className="icon-purple" />
          <h3>System Snapshot Registry</h3>
          <span className="backups-count-badge">{backups.length} Backups</span>
        </div>

        <div className="backups-card__body">
          {isLoading && backups.length === 0 ? (
            <div className="backups-loading">
              <Loader2 size={32} className="backups-spin" />
              <p>Fetching backups registry...</p>
            </div>
          ) : backups.length === 0 ? (
            <div className="backups-empty">
              <HardDrive size={44} />
              <p>No historical backups recorded in the system.</p>
              <span>Click the button above to generate a new safe JSON database snapshot.</span>
            </div>
          ) : (
            <div className="backups-table-wrap">
              {/* Responsive Cards on Mobile, Table on Desktop */}
              <table className="backups-table">
                <thead>
                  <tr>
                    <th>Filename</th>
                    <th>Created At</th>
                    <th>Size</th>
                    <th>Created By</th>
                    <th>Note</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((backup) => (
                    <tr key={backup.id} className="backups-tr">
                      <td className="backups-td-name">
                        <FileJson size={14} className="icon-gray" />
                        <span>{backup.file_name}</span>
                      </td>
                      <td className="backups-td-date">
                        <Clock size={12} className="icon-inline" />
                        {formatDate(backup.created_at)}
                      </td>
                      <td className="backups-td-size">{backup.size_readable}</td>
                      <td>
                        <span className="backups-by-badge">@{backup.created_by}</span>
                      </td>
                      <td className="backups-td-note">{backup.note || '—'}</td>
                      <td>
                        <button
                          className="backups-action-btn"
                          onClick={() => handleDownload(backup)}
                          disabled={downloadingId === backup.id}
                          title="Secure Download"
                          id={`download-backup-${backup.id}`}
                        >
                          {downloadingId === backup.id ? (
                            <Loader2 size={13} className="backups-spin" />
                          ) : (
                            <Download size={13} />
                          )}
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile layout - renders as cards */}
              <div className="backups-cards-mobile">
                {backups.map((backup) => (
                  <div key={backup.id} className="backups-mobile-card">
                    <div className="mobile-card-row mobile-card-header">
                      <div className="mobile-card-title">
                        <FileJson size={14} className="icon-purple" />
                        <span>{backup.file_name}</span>
                      </div>
                      <span className="backups-by-badge">@{backup.created_by}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="lbl">Snapshot Date</span>
                      <span className="val">{formatDate(backup.created_at)}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="lbl">File Size</span>
                      <span className="val">{backup.size_readable}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="lbl">Note</span>
                      <span className="val">{backup.note || '—'}</span>
                    </div>
                    <button
                      className="backups-action-btn backups-action-btn--full"
                      onClick={() => handleDownload(backup)}
                      disabled={downloadingId === backup.id}
                      id={`download-backup-mob-${backup.id}`}
                    >
                      {downloadingId === backup.id ? (
                        <Loader2 size={13} className="backups-spin" />
                      ) : (
                        <Download size={13} />
                      )}
                      Download Backup File
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="backups-modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="backups-modal admin-glow-card" onClick={e => e.stopPropagation()}>
            <div className="backups-modal__header">
              <ShieldAlert size={20} className="icon-orange" />
              <h3>Confirm Safe Database Backup</h3>
            </div>
            <div className="backups-modal__body">
              <p>You are about to initiate a production backup of Progressly. To comply with security mandates, the following data is excluded from the snapshot:</p>
              <ul className="modal-exclusion-list">
                <li>All user password hashes</li>
                <li>JWT authentication refresh tokens</li>
                <li>Session tokens and API secret keys</li>
              </ul>
              <p className="modal-confirm-warning">The resulting JSON file will be recorded in the backup registry and can only be downloaded by authenticated administrators.</p>
            </div>
            <div className="backups-modal__actions">
              <button className="backups-btn backups-btn--secondary" onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
              <button className="backups-btn backups-btn--primary" onClick={handleCreateBackup} id="backups-confirm-btn">
                Run Backup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
