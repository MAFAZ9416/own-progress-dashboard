import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
  Menu,
  Search,
  Bell,
  Moon,
  Sun,
  Maximize2,
  Minimize2,
  ChevronDown,
  User,
  Settings,
  LogOut,
  CheckCircle2,
  Info,
  AlertTriangle,
  Award
} from 'lucide-react'
import { getMediaUrl } from '../../api'
import notificationService from '../../services/notificationService'
import NotificationDetailModal from '../../components/notifications/NotificationDetailModal'
import './Topbar.css'

export default function Topbar({ onToggleSidebar }) {
  const { user, logout } = useAuth()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [isThemeDark, setIsThemeDark] = useState(true)
  const dropdownRef = useRef(null)

  const [notifications, setNotifications] = useState([])
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState(null)
  const panelRef = useRef(null)

  const loadNotifications = useCallback(async () => {
    setIsLoadingNotifications(true)
    try {
      const data = await notificationService.getNotifications()
      setNotifications(data || [])
    } catch (err) {
      console.error('Failed to load notifications:', err)
    } finally {
      setIsLoadingNotifications(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
    window.addEventListener('notification-changed', loadNotifications)
    return () => window.removeEventListener('notification-changed', loadNotifications)
  }, [loadNotifications])

  useEffect(() => {
    function handleOutsideClick(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsNotifOpen(false)
      }
    }
    if (isNotifOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
      return () => document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isNotifOpen])

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  )

  const visibleNotifications = useMemo(() => notifications.slice(0, 5), [notifications])

  const handleBellClick = () => {
    setIsNotifOpen((prev) => !prev)
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      window.dispatchEvent(new CustomEvent('notification-changed'))
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const handleNotificationUpdated = useCallback((updatedNotif) => {
    setNotifications(prev => prev.map(n => n.id === updatedNotif.id ? updatedNotif : n))
    window.dispatchEvent(new CustomEvent('notification-changed'))
  }, [])

  const ICONS = {
    success: CheckCircle2,
    info: Info,
    warning: AlertTriangle,
    achievement: Award,
    system: Settings
  }

  function getNotifIcon(type) {
    return ICONS[type] ?? Bell
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


  // Handle Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Sync fullscreen change state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fallback avatar
  const defaultAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
  const avatarSrc = user?.avatar
    ? getMediaUrl(user.avatar)
    : defaultAvatar

  return (
    <header className="admin-topbar">
      {/* Left side: Hamburger menu + Search */}
      <div className="admin-topbar__left">
        <button 
          onClick={onToggleSidebar} 
          className="admin-topbar__hamburger"
          aria-label="Open Sidebar"
          id="admin-hamburger-btn"
        >
          <Menu size={20} strokeWidth={2} />
        </button>

        <div className="admin-topbar__search-wrapper">
          <Search size={15} className="admin-topbar__search-icon" />
          <input 
            type="text" 
            placeholder="Search anything..." 
            className="admin-topbar__search-input"
            id="admin-search-input"
          />
          <kbd className="admin-topbar__search-kbd">⌘K</kbd>
        </div>
      </div>

      {/* Right side: Global Actions & User Profile */}
      <div className="admin-topbar__right">
        {/* Notification icon */}
        <div className="topbar__notif-wrap" ref={panelRef}>
          <button 
            className="admin-topbar__action-btn admin-topbar__action-btn--notify" 
            aria-label="View notifications"
            id="admin-topbar-bell-btn"
            onClick={handleBellClick}
          >
            <Bell size={18} strokeWidth={1.8} />
            {unreadCount > 0 && <span className="admin-topbar__bell-badge">{unreadCount}</span>}
          </button>

          {isNotifOpen && (
            <div className="topbar__notif-panel" style={{ right: 0, top: '100%', marginTop: '10px' }}>
              <div className="topbar__notif-panel-head">
                <div>
                  <p className="topbar__notif-panel-title">Notifications</p>
                  <p className="topbar__notif-panel-sub">{unreadCount} unread</p>
                </div>
                <button className="topbar__notif-panel-link" onClick={handleMarkAllRead}>
                  Mark all read
                </button>
              </div>

              <div className="topbar__notif-list">
                {isLoadingNotifications ? (
                  <p className="topbar__notif-empty">Loading notifications...</p>
                ) : visibleNotifications.length > 0 ? (
                  visibleNotifications.map((notification) => {
                    const type = notification.type ?? notification.notification_type
                    const Icon = getNotifIcon(type)
                    return (
                      <button
                        key={notification.id}
                        className={`topbar__notif-item ${!notification.is_read ? 'topbar__notif-item--unread' : ''}`}
                        onClick={() => {
                          setSelectedNotification(notification)
                          setIsNotifOpen(false)
                        }}
                      >
                        <span className={`topbar__notif-icon topbar__notif-icon--${type}`}>
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
                  <p className="topbar__notif-empty">No notifications</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle (visual mock) */}
        <button 
          onClick={() => setIsThemeDark(!isThemeDark)} 
          className="admin-topbar__action-btn"
          aria-label="Toggle theme mode"
          id="admin-topbar-theme-btn"
        >
          {isThemeDark ? <Moon size={18} strokeWidth={1.8} /> : <Sun size={18} strokeWidth={1.8} />}
        </button>

        {/* Fullscreen icon */}
        <button 
          onClick={toggleFullscreen} 
          className="admin-topbar__action-btn admin-topbar__action-btn--fullscreen"
          aria-label="Toggle fullscreen mode"
          id="admin-topbar-fullscreen-btn"
        >
          {isFullscreen ? <Minimize2 size={18} strokeWidth={1.8} /> : <Maximize2 size={18} strokeWidth={1.8} />}
        </button>

        {/* Small Divider */}
        <div className="admin-topbar__divider"></div>

        {/* Admin profile detail */}
        <div className="admin-topbar__profile-wrapper" ref={dropdownRef}>
          <button 
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="admin-topbar__profile-trigger"
            id="admin-topbar-profile-trigger"
          >
            <div className="admin-topbar__avatar-container">
              <img 
                src={avatarSrc} 
                alt="Profile" 
                className="admin-topbar__avatar"
                onError={(e) => { e.target.src = defaultAvatar }}
              />
            </div>
            <div className="admin-topbar__profile-details">
              <span className="admin-topbar__profile-name">
                {user?.full_name || "Admin User"}
              </span>
              <span className="admin-topbar__profile-role">
                {user?.is_superuser ? "Super Admin" : "Staff"}
              </span>
            </div>
            <ChevronDown size={14} className={`admin-topbar__profile-chevron ${isProfileDropdownOpen ? 'admin-topbar__profile-chevron--open' : ''}`} />
          </button>

          {/* Profile Dropdown panel */}
          {isProfileDropdownOpen && (
            <div className="admin-topbar__dropdown" id="admin-topbar-profile-dropdown">
              <div className="admin-topbar__dropdown-info">
                <span className="admin-topbar__dropdown-name">{user?.full_name || "Admin User"}</span>
                <span className="admin-topbar__dropdown-email">{user?.email || "admin@progressly.com"}</span>
              </div>
              <div className="admin-topbar__dropdown-divider" />
              
              <button className="admin-topbar__dropdown-item" onClick={() => setIsProfileDropdownOpen(false)}>
                <User size={14} />
                <span>My Profile</span>
              </button>
              <button className="admin-topbar__dropdown-item" onClick={() => setIsProfileDropdownOpen(false)}>
                <Settings size={14} />
                <span>Settings</span>
              </button>
              
              <div className="admin-topbar__dropdown-divider" />
              <button 
                onClick={() => {
                  setIsProfileDropdownOpen(false)
                  logout()
                }} 
                className="admin-topbar__dropdown-item admin-topbar__dropdown-item--logout"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        onUpdated={handleNotificationUpdated}
      />
    </header>
  )
}
