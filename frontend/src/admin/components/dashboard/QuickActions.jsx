import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, PlusCircle, CheckSquare, FileText, Database, Volume2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { adminDashboardService } from '../../services/dashboardService'
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
      const response = await adminDashboardService.triggerQuickAction(actionType)
      if (response && response.status === 'success') {
        setActionStatus({
          type: 'success',
          message: response.message || `${label} executed successfully.`
        })
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
        setActionStatus(prev => prev && prev.message === (error.message || response.message) ? null : prev)
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
      id: 'add_task',
      label: 'Add Task',
      description: 'Create milestone task',
      icon: CheckSquare,
      type: 'nav',
      handler: () => handleNavigation('/admin/tasks'),
      color: 'yellow'
    },
    {
      id: 'report',
      label: 'Generate Report',
      description: 'Compile system analytica',
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
      type: 'api',
      handler: () => handleApiAction('announcement', 'Send Announcement'),
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
