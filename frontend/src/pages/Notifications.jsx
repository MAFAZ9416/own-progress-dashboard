import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bell, CheckCheck, Trash2, Info, AlertTriangle, Award, Settings2, CheckCircle2, Inbox } from 'lucide-react'
import notificationService from '../services/notificationService'
import NotificationDetailModal from '../components/notifications/NotificationDetailModal'

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
]

const ICONS = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  achievement: Award,
  system: Settings2,
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

function NotificationIcon({ type }) {
  const Icon = ICONS[type] ?? Bell
  return <Icon size={16} strokeWidth={2} />
}

function EmptyState({ filter }) {
  return (
    <div className="notif-empty">
      <div className="notif-empty__icon">
        <Inbox size={28} strokeWidth={1.8} />
      </div>
      <h3 className="notif-empty__title">
        {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
      </h3>
      <p className="notif-empty__desc">
        {filter === 'unread'
          ? 'You are all caught up. New alerts will appear here.'
          : 'Updates, achievements, and system messages will appear here.'}
      </p>
    </div>
  )
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [busyId, setBusyId] = useState(null)
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState(null)

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await notificationService.getNotifications()
      setNotifications(data || [])
    } catch (err) {
      setError(
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        err?.message ??
        'Failed to load notifications.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications]
  )

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter((notification) => !notification.is_read)
    }
    return notifications
  }, [notifications, filter])

  const handleMarkAllAsRead = useCallback(async () => {
    if (!unreadCount) return
    setIsBulkUpdating(true)
    try {
      await notificationService.markAllAsRead()
      setNotifications((prev) => prev.map((notification) => ({ ...notification, is_read: true })))
    } catch (err) {
      setError(
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        err?.message ??
        'Failed to mark notifications as read.'
      )
    } finally {
      setIsBulkUpdating(false)
    }
  }, [unreadCount])

  const handleMarkAsRead = useCallback(async (notification) => {
    if (!notification || notification.is_read) return
    setBusyId(notification.id)
    try {
      await notificationService.markAsRead(notification.id)
      setNotifications((prev) => prev.map((item) => (
        item.id === notification.id ? { ...item, is_read: true } : item
      )))
    } catch (err) {
      setError(
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        err?.message ??
        'Failed to mark notification as read.'
      )
    } finally {
      setBusyId(null)
    }
  }, [])

  const handleDelete = useCallback(async (notification) => {
    setBusyId(notification.id)
    try {
      await notificationService.deleteNotification(notification.id)
      setNotifications((prev) => prev.filter((item) => item.id !== notification.id))
    } catch (err) {
      setError(
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        err?.message ??
        'Failed to delete notification.'
      )
    } finally {
      setBusyId(null)
    }
  }, [])

  const handleNotificationUpdated = useCallback((updatedNotification) => {
    setNotifications((prev) => prev.map((item) => (
      item.id === updatedNotification.id ? updatedNotification : item
    )))
  }, [])

  return (
    <div id="page-notifications" className="notif-page animate-fade-in">
      <div className="notif-header">
        <div>
          <h1 className="notif-header__title">Notifications</h1>
          <p className="notif-header__sub">Keep track of updates, achievements, and system alerts.</p>
        </div>

        <div className="notif-header__meta">
          <div className="notif-header__pill">
            <Bell size={14} />
            {unreadCount} unread
          </div>
          <button
            className="notif-header__markall"
            onClick={handleMarkAllAsRead}
            disabled={!unreadCount || isBulkUpdating}
          >
            <CheckCheck size={14} />
            Mark all as read
          </button>
        </div>
      </div>

      <div className="notif-toolbar">
        <div className="notif-filters" role="tablist" aria-label="Filter notifications">
          {FILTERS.map(({ label, value }) => (
            <button
              key={value}
              className={`notif-filter ${filter === value ? 'notif-filter--active' : ''}`}
              onClick={() => setFilter(value)}
              aria-current={filter === value ? 'page' : undefined}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="notif-error">{error}</div>}

      {isLoading ? (
        <div className="notif-loading">
          <div className="notif-loading__bar" />
          <div className="notif-loading__bar notif-loading__bar--sm" />
          <div className="notif-loading__bar" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="notif-list">
          {filteredNotifications.map((notification) => {
            const isBusy = busyId === notification.id
            const type = notification.type ?? notification.notification_type
            return (
              <article
                key={notification.id}
                className={`notif-card ${!notification.is_read ? 'notif-card--unread' : ''}`}
                onClick={() => setSelectedNotification(notification)}
                role="button"
                tabIndex={0}
              >
                <div className={`notif-card__icon notif-card__icon--${type}`}>
                  <NotificationIcon type={type} />
                </div>

                <div className="notif-card__body">
                  <div className="notif-card__toprow">
                    <h3 className="notif-card__title">{notification.title}</h3>
                    <span className="notif-card__time">{formatRelativeTime(notification.created_at)}</span>
                  </div>
                  <p className="notif-card__message">{notification.message}</p>
                </div>

                <div className="notif-card__actions" onClick={(event) => event.stopPropagation()}>
                  <button
                    className="notif-card__action"
                    onClick={() => handleMarkAsRead(notification)}
                    disabled={notification.is_read || isBusy}
                  >
                    Mark read
                  </button>
                  <button
                    className="notif-card__action notif-card__action--danger"
                    onClick={() => handleDelete(notification)}
                    disabled={isBusy}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <NotificationDetailModal
        isOpen={!!selectedNotification}
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
        onUpdated={handleNotificationUpdated}
      />
    </div>
  )
}
