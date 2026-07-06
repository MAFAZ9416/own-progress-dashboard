import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Menu, Bell, CheckCircle2, Info, AlertTriangle, Award, Settings2 } from 'lucide-react'
import { getMediaUrl } from '../../api'
import notificationService from '../../services/notificationService'
import { useMediaQuery } from '../../hooks/useMediaQuery'

const PAGE_TITLES = {
  '/dashboard': { title: 'Dashboard',  sub: 'Overview of your progress' },
  '/skills':    { title: 'Skills',     sub: 'Manage and track your skills' },
  '/tasks':     { title: 'Tasks',      sub: 'Your task list and progress' },
  '/profile':   { title: 'Profile',    sub: 'Your personal information and stats' },
  '/settings':  { title: 'Settings',   sub: 'Customize your dashboard preferences' },
  '/notifications': { title: 'Notifications', sub: 'Updates, milestones, and system alerts' },
}

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

const Topbar = memo(function Topbar({ onToggleSidebar }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const { user }     = useAuth()
  const page         = PAGE_TITLES[pathname] ?? { title: 'Progressly', sub: '' }
  const [notifications, setNotifications] = useState([])
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)
  const panelRef = useRef(null)

  const displayName = user?.full_name ?? user?.first_name ?? ''
  const initials = displayName?.[0]?.toUpperCase() ?? '?'

  const loadNotifications = useCallback(async () => {
    setIsLoadingNotifications(true)
    try {
      const data = await notificationService.getNotifications()
      setNotifications(data || [])
    } finally {
      setIsLoadingNotifications(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications, pathname])

  useEffect(() => {
    setIsNotifOpen(false)
  }, [pathname])

  useEffect(() => {
    function handleOutsideClick(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsNotifOpen(false)
      }
    }

    if (isNotifOpen && !isMobile) {
      document.addEventListener('mousedown', handleOutsideClick)
      return () => document.removeEventListener('mousedown', handleOutsideClick)
    }

    return undefined
  }, [isNotifOpen, isMobile])

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications]
  )

  const visibleNotifications = notifications.slice(0, 5)

  const handleBellClick = () => {
    if (isMobile) {
      navigate('/notifications')
      return
    }

    setIsNotifOpen((prev) => !prev)
  }

  const handleMarkRead = async (notification) => {
    if (!notification || notification.is_read) return
    try {
      await notificationService.markAsRead(notification.id)
      setNotifications((prev) => prev.map((item) => (
        item.id === notification.id ? { ...item, is_read: true } : item
      )))
    } catch {
      // Keep the UI stable; the notifications page offers a fuller retry surface.
    }
  }

  return (
    <header id="topbar" className="topbar">
      {/* Left: page title + breadcrumb */}
      <div className="topbar__left">
        <button
          className="topbar__hamburger"
          onClick={onToggleSidebar}
          aria-label="Open menu"
        >
          <Menu size={20} strokeWidth={2} />
        </button>
        <div className="topbar__title-group">
          <h1 className="topbar__title">{page.title}</h1>
          {page.sub && <p className="topbar__sub">{page.sub}</p>}
        </div>
      </div>

      {/* Right: actions + avatar */}
      <div className="topbar__right">
        <div className="topbar__notif-wrap" ref={panelRef}>
          {/* Notification bell */}
          <button
            id="topbar-notifications"
            className="topbar__icon-btn"
            aria-label="Notifications"
            onClick={handleBellClick}
          >
            <Bell size={18} strokeWidth={1.8} />
            {unreadCount > 0 && <span className="topbar__notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>

          {!isMobile && isNotifOpen && (
            <div className="topbar__notif-panel">
              <div className="topbar__notif-panel-head">
                <div>
                  <p className="topbar__notif-panel-title">Notifications</p>
                  <p className="topbar__notif-panel-sub">{unreadCount} unread</p>
                </div>
                <button className="topbar__notif-panel-link" onClick={() => navigate('/notifications')}>
                  View all
                </button>
              </div>

              <div className="topbar__notif-list">
                {isLoadingNotifications ? (
                  <p className="topbar__notif-empty">Loading notifications...</p>
                ) : visibleNotifications.length > 0 ? (
                  visibleNotifications.map((notification) => {
                    const Icon = ICONS[notification.notification_type] ?? Bell
                    return (
                      <button
                        key={notification.id}
                        className={`topbar__notif-item ${!notification.is_read ? 'topbar__notif-item--unread' : ''}`}
                        onClick={() => handleMarkRead(notification)}
                      >
                        <span className={`topbar__notif-icon topbar__notif-icon--${notification.notification_type}`}>
                          <Icon size={14} strokeWidth={2} />
                        </span>
                        <span className="topbar__notif-copy">
                          <span className="topbar__notif-toprow">
                            <span className="topbar__notif-title">{notification.title}</span>
                            <span className="topbar__notif-time">{formatRelativeTime(notification.created_at)}</span>
                          </span>
                          <span className="topbar__notif-message">{notification.message}</span>
                        </span>
                      </button>
                    )
                  })
                ) : (
                  <p className="topbar__notif-empty">No notifications yet.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="topbar__divider" />

        {/* User info */}
        <div className="topbar__user">
          <div className="topbar__user-info">
            <span className="topbar__user-name">{displayName}</span>
            <span className="topbar__user-role">Member</span>
          </div>
          <Link to="/profile" className="topbar__avatar hover:ring-2 hover:ring-indigo-500 hover:scale-105 transition-all cursor-pointer" aria-label="Go to profile">
            {user?.avatar ? (
              <img src={getMediaUrl(user.avatar)} alt={displayName} />
            ) : (
              initials
            )}
          </Link>
        </div>
      </div>
    </header>
  )
})

export default Topbar
