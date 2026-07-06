import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { X, CheckCircle2, Info, AlertTriangle, Award, Settings2, CalendarDays } from 'lucide-react'
import notificationService from '../../services/notificationService'

const ICONS = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  achievement: Award,
  system: Settings2,
}

const TYPE_EMOJI = {
  success: '✅',
  info: 'ℹ️',
  warning: '⚠️',
  achievement: '🏆',
  system: '🚀',
}

function formatRelativeTime(value) {
  if (!value) return ''
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.max(1, Math.round(diffMs / 60000))
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.round(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.round(diffHours / 24)
  return `${diffDays}d ago`
}

function formatDate(value) {
  if (!value) return 'Unknown date'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function buildDetails(notification) {
  const type = notification?.type ?? notification?.notification_type ?? 'info'
  const metadata = notification?.metadata ?? {}

  if (type === 'achievement') {
    return {
      title: metadata.skill_name ? `${metadata.skill_name} achievement` : 'Achievement unlocked',
      actionLabel: 'View Skill',
      actionPath: '/skills',
      sections: [
        { label: 'Reason unlocked', value: `Reached ${metadata.milestone ?? metadata.progress ?? 100}% progress` },
        { label: 'Skill', value: metadata.skill_name ?? 'Unknown skill' },
        { label: 'Completed tasks', value: metadata.completed_tasks != null && metadata.total_tasks != null ? `${metadata.completed_tasks}/${metadata.total_tasks}` : 'Not available' },
        { label: 'Progress', value: metadata.progress != null ? `${metadata.progress}%` : 'Not available' },
      ],
    }
  }

  if (metadata.task_name || type === 'success') {
    return {
      title: metadata.task_name ?? 'Task update',
      actionLabel: 'View Task',
      actionPath: '/tasks',
      sections: [
        { label: 'Task', value: metadata.task_name ?? notification.title },
        { label: 'Related skill', value: metadata.skill_name ?? 'Not available' },
        { label: 'Completion status', value: metadata.status ?? 'Completed' },
        { label: 'Completed date', value: formatDate(metadata.completed_at ?? notification.created_at) },
      ],
    }
  }

  if (metadata.skill_name || type === 'info') {
    return {
      title: metadata.skill_name ? `${metadata.skill_name} progress` : 'Skill update',
      actionLabel: 'View Skill',
      actionPath: '/skills',
      sections: [
        { label: 'Skill', value: metadata.skill_name ?? 'Not available' },
        { label: 'Completed tasks', value: metadata.completed_tasks != null && metadata.total_tasks != null ? `${metadata.completed_tasks}/${metadata.total_tasks}` : 'Not available' },
        { label: 'Progress', value: metadata.progress != null ? `${metadata.progress}%` : 'Not available' },
        { label: 'Unlocked', value: formatDate(notification.created_at) },
      ],
    }
  }

  return {
    title: 'System notification',
    actionLabel: null,
    actionPath: null,
    sections: [
      { label: 'Date sent', value: formatDate(notification.created_at) },
      { label: 'Full announcement', value: notification.message },
    ],
  }
}

export default function NotificationDetailModal({ notification, isOpen, onClose, onUpdated }) {
  const navigate = useNavigate()

  useEffect(() => {
    if (!isOpen || !notification || notification.is_read) return undefined

    let active = true
    notificationService.markAsRead(notification.id)
      .then((updated) => {
        if (!active) return
        onUpdated?.({
          ...notification,
          ...(updated ?? {}),
          is_read: true,
        })
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [isOpen, notification, onUpdated])

  const detail = useMemo(() => (notification ? buildDetails(notification) : null), [notification])

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }

    return undefined
  }, [isOpen, onClose])

  if (!isOpen || !notification || !detail) return null

  const type = notification?.type ?? notification?.notification_type ?? 'info'
  const Icon = ICONS[type] ?? Info
  const emoji = TYPE_EMOJI[type] ?? 'ℹ️'

  return createPortal(
    <div className="notif-modal__overlay" onClick={onClose} role="presentation">
      <div className="notif-modal__sheet" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="notif-modal-title">
        <div className="notif-modal__header">
          <div className={`notif-modal__icon notif-modal__icon--${type}`}>
            <span className="notif-modal__emoji" aria-hidden="true">{emoji}</span>
            <Icon size={16} strokeWidth={2} className="notif-modal__glyph" />
          </div>
          <div className="notif-modal__heading">
            <p className="notif-modal__eyebrow">{detail.title}</p>
            <h2 id="notif-modal-title" className="notif-modal__title">{notification.title}</h2>
            <p className="notif-modal__sub">
              <CalendarDays size={14} />
              {formatDate(notification.created_at)} • {formatRelativeTime(notification.created_at)}
            </p>
          </div>
          <button className="notif-modal__close" onClick={onClose} aria-label="Close notification">
            <X size={20} />
          </button>
        </div>

        <div className="notif-modal__body">
          <div className="notif-modal__message">
            <p>{notification.message}</p>
          </div>

          <div className="notif-modal__details">
            {detail.sections.map((section) => (
              <div key={section.label} className="notif-modal__detail-row">
                <span className="notif-modal__detail-label">{section.label}</span>
                <span className="notif-modal__detail-value">{section.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="notif-modal__footer">
          {detail.actionPath ? (
            <button
              className="notif-modal__action"
              onClick={() => {
                onClose?.()
                navigate(detail.actionPath)
              }}
            >
              {detail.actionLabel}
            </button>
          ) : null}
          <button className="notif-modal__secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
