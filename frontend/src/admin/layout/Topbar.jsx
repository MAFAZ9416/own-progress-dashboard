import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { apiClient, getMediaUrl } from '../../api'
import { useAdminRefresh } from '../contexts/RefreshContext'
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
  Award,
  Database,
  MessageSquare,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react'
import { getQueuedRequests, isSyncing } from '../../utils/offlineQueue'
import notificationService from '../../services/notificationService'
import NotificationDetailModal from '../../components/notifications/NotificationDetailModal'
import './Topbar.css'

export default function Topbar({ onToggleSidebar }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [isThemeDark, setIsThemeDark] = useState(true)
  const dropdownRef = useRef(null)

  const [offline, setOffline] = useState(!navigator.onLine)
  const [syncingState, setSyncingState] = useState(isSyncing)
  const [queuedCount, setQueuedCount] = useState(0)
  const [lastSyncStr, setLastSyncStr] = useState('')

  const updateStatus = useCallback(async () => {
    setOffline(!navigator.onLine)
    setSyncingState(isSyncing)
    const queue = await getQueuedRequests()
    setQueuedCount(queue.length)
    
    const time = localStorage.getItem('pwa_last_sync_time')
    if (time) {
      try {
        const d = new Date(time)
        setLastSyncStr(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      } catch (e) {
        setLastSyncStr('')
      }
    } else {
      setLastSyncStr('')
    }
  }, [])

  useEffect(() => {
    updateStatus()
    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)
    window.addEventListener('progressly-pwa-sync-status', updateStatus)
    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
      window.removeEventListener('progressly-pwa-sync-status', updateStatus)
    }
  }, [updateStatus])

  const [notifications, setNotifications] = useState([])
  const [feedbacks, setFeedbacks] = useState([])
  const [backups, setBackups] = useState([])
  const [systemAlerts, setSystemAlerts] = useState([])

  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState(null)
  const panelRef = useRef(null)

  const loadDropdownData = useCallback(async () => {
    setIsLoadingNotifications(true)
    // 1. Notifications
    try {
      const data = await notificationService.getNotifications()
      setNotifications(data || [])
    } catch (err) {
      console.error('Failed to load notifications:', err)
    }

    // 2. Feedbacks (recent 3)
    try {
      const res = await apiClient.get('/admin/feedback/')
      const list = res.data?.feedback || []
      setFeedbacks(list.slice(0, 3))
    } catch (err) {
      console.error('Failed to load feedbacks for topbar:', err)
    }

    // 3. Backups (recent 3)
    try {
      const res = await apiClient.get('/admin/backups/')
      const list = res.data?.backups || []
      setBackups(list.slice(0, 3))
    } catch (err) {
      console.error('Failed to load backups for topbar:', err)
    }

    // 4. System Health Alerts
    try {
      const res = await apiClient.get('/admin/health/')
      const healthData = res.data || {}
      const alerts = []
      if (healthData.services) {
        Object.entries(healthData.services).forEach(([name, service]) => {
          if (service.status !== 'Operational') {
            alerts.push({
              id: name,
              title: `${service.label} degraded`,
              message: `Status: ${service.status}`,
            })
          }
        })
      }
      setSystemAlerts(alerts)
    } catch (err) {
      console.error('Failed to load system health status:', err)
    }
    setIsLoadingNotifications(false)
  }, [])

  useEffect(() => {
    loadDropdownData()
    window.addEventListener('notification-changed', loadDropdownData)
    return () => window.removeEventListener('notification-changed', loadDropdownData)
  }, [loadDropdownData])

  useAdminRefresh('notifications', () => {
    loadDropdownData()
  })

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

  const visibleNotifications = useMemo(() => notifications.filter(n => !n.is_read).slice(0, 5), [notifications])

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
            <div className="topbar__notif-panel" ref={panelRef} style={{ right: 0, top: '100%', marginTop: '10px', display: 'flex', flexDirection: 'column' }}>
              <div className="topbar__notif-panel-head">
                <div>
                  <p className="topbar__notif-panel-title">Administration Alerts Center</p>
                  <p className="topbar__notif-panel-sub">Priority Realtime Feeds</p>
                </div>
                <button className="topbar__notif-panel-link" onClick={handleMarkAllRead}>
                  Clear Notifs
                </button>
              </div>

              <div className="topbar__notif-list" style={{ overflowY: 'auto', flex: 1, maxHeight: '24rem' }}>
                
                {/* 1. Critical System Alerts */}
                <div className="topbar__section-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.85rem 0.3rem', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#ef4444' }}>
                  <span>Critical System Alerts</span>
                  <span style={{ fontSize: '0.7rem', background: 'rgba(239,68,68,0.15)', padding: '1px 6px', borderRadius: '4px' }}>{systemAlerts.length}</span>
                </div>
                {systemAlerts.length > 0 ? (
                  systemAlerts.map(alert => (
                    <div key={alert.id} className="topbar__notif-item topbar__notif-item--unread">
                      <span className="topbar__notif-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                        <AlertTriangle size={14} />
                      </span>
                      <span className="topbar__notif-copy">
                        <span className="topbar__notif-title" style={{ color: '#ef4444' }}>{alert.title}</span>
                        <span className="topbar__notif-message">{alert.message}</span>
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="topbar__notif-empty" style={{ fontSize: '0.75rem', padding: '0.5rem 0.85rem', color: 'rgba(255,255,255,0.4)' }}>All systems operational</p>
                )}

                {/* 2. Unread Notifications */}
                <div className="topbar__section-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.85rem 0.3rem', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#7c3aed', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <span>Unread Notifications</span>
                  <span style={{ fontSize: '0.7rem', background: 'rgba(124,58,237,0.15)', padding: '1px 6px', borderRadius: '4px' }}>{unreadCount}</span>
                </div>
                {visibleNotifications.length > 0 ? (
                  visibleNotifications.map((notification) => {
                    const type = notification.type ?? notification.notification_type
                    const Icon = getNotifIcon(type)
                    return (
                      <button
                        key={notification.id}
                        className="topbar__notif-item topbar__notif-item--unread"
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
                  <p className="topbar__notif-empty" style={{ fontSize: '0.75rem', padding: '0.5rem 0.85rem', color: 'rgba(255,255,255,0.4)' }}>No unread notifications</p>
                )}

                {/* 3. Recent Feedback */}
                <div className="topbar__section-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.85rem 0.3rem', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#6366f1', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <span>Recent Feedback</span>
                  <span style={{ fontSize: '0.7rem', background: 'rgba(99,102,241,0.15)', padding: '1px 6px', borderRadius: '4px' }}>{feedbacks.length}</span>
                </div>
                {feedbacks.length > 0 ? (
                  feedbacks.map((fb) => (
                    <button
                      key={fb.id}
                      className="topbar__notif-item"
                      onClick={() => {
                        navigate(`/admin/feedback`)
                        setIsNotifOpen(false)
                      }}
                    >
                      <span className="topbar__notif-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
                        <MessageSquare size={14} />
                      </span>
                      <span className="topbar__notif-copy">
                        <span className="topbar__notif-toprow">
                          <span className="topbar__notif-title" style={{ fontWeight: 650 }}>{fb.name} ({fb.rating}★)</span>
                          <span className="topbar__notif-time">{formatRelativeTime(fb.created_at)}</span>
                        </span>
                        <span className="topbar__notif-message">{fb.subject}</span>
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="topbar__notif-empty" style={{ fontSize: '0.75rem', padding: '0.5rem 0.85rem', color: 'rgba(255,255,255,0.4)' }}>No feedback reviews</p>
                )}

                {/* 4. Latest Backups */}
                <div className="topbar__section-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.85rem 0.3rem', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#10b981', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <span>Latest Backups</span>
                  <span style={{ fontSize: '0.7rem', background: 'rgba(16,185,129,0.15)', padding: '1px 6px', borderRadius: '4px' }}>{backups.length}</span>
                </div>
                {backups.length > 0 ? (
                  backups.map((bk) => (
                    <button
                      key={bk.id}
                      className="topbar__notif-item"
                      onClick={() => {
                        navigate('/admin/backups')
                        setIsNotifOpen(false)
                      }}
                    >
                      <span className="topbar__notif-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                        <Database size={14} />
                      </span>
                      <span className="topbar__notif-copy">
                        <span className="topbar__notif-toprow">
                          <span className="topbar__notif-title" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{bk.file_name?.substring(0, 16)}...</span>
                          <span className="topbar__notif-time">{formatRelativeTime(bk.created_at)}</span>
                        </span>
                        <span className="topbar__notif-message">Size: {bk.file_size || '—'}</span>
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="topbar__notif-empty" style={{ fontSize: '0.75rem', padding: '0.5rem 0.85rem', color: 'rgba(255,255,255,0.4)' }}>No database snapshots</p>
                )}

              </div>

              {/* Quick Actions Footer */}
              <div className="topbar__notif-panel-footer" style={{ display: 'flex', gap: '6px', padding: '0.65rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(0,0,0,0.2)', borderBottomLeftRadius: '1rem', borderBottomRightRadius: '1rem' }}>
                <button
                  onClick={() => { navigate('/admin/feedback'); setIsNotifOpen(false); }}
                  className="footer-action-btn"
                  style={{ flex: 1, padding: '6px', fontSize: '0.7rem', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', background: 'transparent', color: '#cbd5e1', cursor: 'pointer' }}
                >
                  Feedback
                </button>
                <button
                  onClick={() => { navigate('/admin/notifications'); setIsNotifOpen(false); }}
                  className="footer-action-btn"
                  style={{ flex: 1, padding: '6px', fontSize: '0.7rem', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', background: 'transparent', color: '#cbd5e1', cursor: 'pointer' }}
                >
                  Notifs
                </button>
                <button
                  onClick={() => { navigate('/admin/activity-logs'); setIsNotifOpen(false); }}
                  className="footer-action-btn"
                  style={{ flex: 1, padding: '6px', fontSize: '0.7rem', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', background: 'transparent', color: '#cbd5e1', cursor: 'pointer' }}
                >
                  Audit Logs
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PWA Connection / Sync Status Indicator */}
        <div className="flex items-center gap-2 mr-3 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800 text-[11px] font-semibold">
          {offline ? (
            <span className="flex items-center gap-1.5 text-red-400">
              <WifiOff size={12} strokeWidth={2.5} />
              <span>Offline</span>
            </span>
          ) : syncingState ? (
            <span className="flex items-center gap-1.5 text-yellow-400">
              <RefreshCw size={12} className="animate-spin" />
              <span>Syncing...</span>
            </span>
          ) : queuedCount > 0 ? (
            <span className="flex items-center gap-1.5 text-violet-400">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              <span>Queued ({queuedCount})</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Online</span>
            </span>
          )}
          
          {lastSyncStr && (
            <span className="text-slate-500 font-normal border-l border-slate-800 pl-2">
              Sync {lastSyncStr}
            </span>
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
