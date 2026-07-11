import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Menu, Bell, CheckCircle2, Info, AlertTriangle, Award, Settings2, Search, X, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { getMediaUrl } from '../../api'
import { getQueuedRequests, isSyncing } from '../../utils/offlineQueue'
import notificationService from '../../services/notificationService'
import dashboardService from '../../services/dashboardService'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import NotificationDetailModal from '../notifications/NotificationDetailModal'

const PAGE_TITLES = {
  '/dashboard': { title: 'Dashboard',  sub: 'Overview of your progress' },
  '/skills':    { title: 'Skills',     sub: 'Manage and track your skills' },
  '/tasks':     { title: 'Tasks',      sub: 'Your task list and progress' },
  '/profile':   { title: 'Profile',    sub: 'Your personal information and stats' },
  '/settings':  { title: 'Settings',   sub: 'Customize your dashboard preferences' },
  '/notifications': { title: 'Notifications', sub: 'Updates, milestones, and system alerts' },
  '/achievements': { title: 'Achievements', sub: 'Your badges and milestones' },
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
  const [selectedNotification, setSelectedNotification] = useState(null)
  const panelRef = useRef(null)

  const displayName = user?.full_name ?? user?.first_name ?? ''
  const initials = displayName?.[0]?.toUpperCase() ?? '?'

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

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const searchRef = useRef(null)
  const searchTimerRef = useRef(null)

  // Debounced search
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    if (!searchQuery.trim()) {
      setSearchResults([])
      setIsSearchOpen(false)
      return
    }
    searchTimerRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const data = await dashboardService.search(searchQuery.trim())
        setSearchResults(data?.results ?? [])
        setIsSearchOpen(true)
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)
    return () => clearTimeout(searchTimerRef.current)
  }, [searchQuery])

  // Close search on outside click
  useEffect(() => {
    function handleOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const handleSearchNavigate = (result) => {
    navigate(result.path)
    setSearchQuery('')
    setIsSearchOpen(false)
    setSearchResults([])
  }

  const typeIcon = { skill: '🧠', task: '✅', achievement: '🏆' }

  const handleBellClick = () => {
    if (isMobile) {
      navigate('/notifications')
      return
    }

    setIsNotifOpen((prev) => !prev)
  }

  const handleNotificationUpdated = useCallback((updatedNotification) => {
    setNotifications((prev) => prev.map((item) => (
      item.id === updatedNotification.id ? updatedNotification : item
    )))
  }, [])

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

      {/* Center: Global Search */}
      <div className="topbar__search-wrap" ref={searchRef}>
        <div className={`topbar__search-box ${searchQuery ? 'topbar__search-box--active' : ''}`}>
          <Search size={15} className="topbar__search-icon" strokeWidth={2} />
          <input
            id="topbar-search-input"
            type="text"
            placeholder="Search skills, tasks, achievements..."
            className="topbar__search-input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim() && setIsSearchOpen(true)}
            autoComplete="off"
          />
          {searchQuery && (
            <button
              className="topbar__search-clear"
              onClick={() => { setSearchQuery(''); setIsSearchOpen(false); setSearchResults([]) }}
              aria-label="Clear search"
            >
              <X size={13} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {isSearchOpen && (
          <div className="topbar__search-dropdown" role="listbox">
            {isSearching ? (
              <div className="topbar__search-item topbar__search-item--muted">Searching...</div>
            ) : searchResults.length === 0 ? (
              <div className="topbar__search-item topbar__search-item--muted">No results found</div>
            ) : (
              searchResults.map((result, i) => (
                <button
                  key={`${result.type}-${result.id}-${i}`}
                  className="topbar__search-item"
                  onClick={() => handleSearchNavigate(result)}
                  role="option"
                >
                  <span className="topbar__search-item-type">{typeIcon[result.type] ?? '📄'}</span>
                  <span className="topbar__search-item-label">{result.label}</span>
                  <span className="topbar__search-item-badge">{result.type}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right: actions + avatar */}
      <div className="topbar__right">
        <div className="topbar__notif-wrap" ref={panelRef}>
          {/* Notification bell */}
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

          <button
            id="topbar-bell-btn"
            className={`topbar__btn-action ${isNotifOpen ? 'topbar__btn-action--active' : ''}`}
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
                    const type = notification.type ?? notification.notification_type
                    const Icon = ICONS[type] ?? Bell
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

      <NotificationDetailModal
        isOpen={!!selectedNotification}
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
        onUpdated={handleNotificationUpdated}
      />
    </header>
  )
})

export default Topbar
