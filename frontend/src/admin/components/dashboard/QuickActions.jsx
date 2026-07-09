import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, PlusCircle, CheckSquare, FileText, Database, Volume2, Loader2, CheckCircle2, AlertCircle, Download } from 'lucide-react'
import { adminDashboardService } from '../../services/dashboardService'
import { apiClient } from '../../../api'
import './QuickActions.css'

export default function QuickActions({ onActionSuccess }) {
  const navigate = useNavigate()
  const [runningAction, setRunningAction] = useState(null) // key of the running action
  const [actionStatus, setActionStatus] = useState(null) // { type: 'success'|'error', message: string }

  const handleNavigation = (path) => {
    navigate(path)
  }

  const handleApiAction = async (actionType, label) => {
    if (runningAction) return
    setRunningAction(actionType)
    setActionStatus(null)

    try {
      if (actionType === 'export') {
        // Direct JSON export download
        const response = await apiClient.post('/admin/action/', { action_type: 'export' })
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `progressly_export_${new Date().toISOString().slice(0,10)}.json`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)

        setActionStatus({
          type: 'success',
          message: 'Dashboard data exported successfully.'
        })
        return
      }

      const response = await adminDashboardService.triggerQuickAction(actionType)
      
      if (response && response.status === 'success') {
        setActionStatus({
          type: 'success',
          message: response.message || `${label} executed successfully.`
        })

        // Auto-download flow for report
        if (actionType === 'report' && response.file_name) {
          const downloadResponse = await apiClient.get(`/admin/reports/download/?filename=${response.file_name}`, {
            responseType: 'blob'
          })
          const blob = new Blob([downloadResponse.data], { type: 'text/csv' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = response.file_name
          document.body.appendChild(a)
          a.click()
          a.remove()
          window.URL.revokeObjectURL(url)
        }

        // Auto-download flow for backup
        if (actionType === 'backup' && response.backup_id) {
          const downloadResponse = await apiClient.get(`/admin/backups/${response.backup_id}/download/`, {
            responseType: 'blob'
          })
          const blob = new Blob([downloadResponse.data], { type: 'application/json' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = response.file_name || 'progressly_backup.json'
          document.body.appendChild(a)
          a.click()
          a.remove()
          window.URL.revokeObjectURL(url)
        }

        if (onActionSuccess) {
          onActionSuccess() // Trigger dashboard reload/update
        }
      } else {
        setActionStatus({
          type: 'error',
          message: response.message || `Failed to execute ${label.toLowerCase()}.`
        })
      }
    } catch (error) {
      setActionStatus({
        type: 'error',
        message: error.response?.data?.message || error.message || `An error occurred while executing ${label.toLowerCase()}.`
      })
    } finally {
      setRunningAction(null)
      // Auto-clear message after 5 seconds
      setTimeout(() => {
        setActionStatus(prev => prev ? null : prev)
      }, 5000)
    }
  }

  const actionItems = [
    {
      id: 'add_user',
      label: 'Add User',
      description: 'Register a new profile',
      icon: UserPlus,
      type: 'nav',
      handler: () => handleNavigation('/admin/users'),
      color: 'purple'
    },
    {
      id: 'add_skill',
      label: 'Add Skill',
      description: 'Define skill paths',
      icon: PlusCircle,
      type: 'nav',
      handler: () => handleNavigation('/admin/skills'),
      color: 'blue'
    },
    {
      id: 'export',
      label: 'Export JSON',
      description: 'Download metrics database',
      icon: Download,
      type: 'api',
      handler: () => handleApiAction('export', 'Export Data'),
      color: 'teal'
    },
    {
      id: 'report',
      label: 'Generate Report',
      description: 'Compile system analytics (CSV)',
      icon: FileText,
      type: 'api',
      handler: () => handleApiAction('report', 'Generate Report'),
      color: 'green'
    },
    {
      id: 'backup',
      label: 'Create Backup',
      description: 'Dump tables & store metadata',
      icon: Database,
      type: 'api',
      handler: () => handleApiAction('backup', 'Create Backup'),
      color: 'orange'
    },
    {
      id: 'announcement',
      label: 'Send Announcement',
      description: 'Broadcast notice to users',
      icon: Volume2,
      type: 'nav',
      handler: () => handleNavigation('/admin/notifications'),
      color: 'red'
    }
  ]

  return (
    <div className="admin-list-card admin-glow-card admin-quick-actions-card">
      <div className="admin-list-card__header">
        <div className="admin-list-card__title-group">
          <h3 className="admin-list-card__title">Quick Actions</h3>
          <span className="admin-list-card__subtitle">Instant triggers</span>
        </div>
      </div>

      <div className="admin-list-card__body">
        {/* Toast / Status banner inside the card */}
        {actionStatus && (
          <div className={`admin-action-status-banner admin-action-status-banner--${actionStatus.type}`}>
            {actionStatus.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
            <span className="admin-action-status-message">{actionStatus.message}</span>
          </div>
        )}

        <div className="admin-actions-grid">
          {actionItems.map((action) => {
            const Icon = action.icon
            const isRunning = runningAction === action.id

            return (
              <button
                key={action.id}
                onClick={action.handler}
                className={`admin-action-btn admin-action-btn--${action.color}`}
                disabled={runningAction !== null}
                id={`admin-btn-${action.id}`}
              >
                <div className="admin-action-btn__icon-wrap">
                  {isRunning ? (
                    <Loader2 size={16} className="admin-action-spinner" />
                  ) : (
                    <Icon size={16} strokeWidth={2.2} />
                  )}
                </div>
                <div className="admin-action-btn__text">
                  <span className="admin-action-btn__label">{action.label}</span>
                  <span className="admin-action-btn__desc">{action.description}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
