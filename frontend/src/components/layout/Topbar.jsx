import { useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Menu, Bell } from 'lucide-react'

const PAGE_TITLES = {
  '/dashboard': { title: 'Dashboard',  sub: 'Overview of your progress' },
  '/skills':    { title: 'Skills',     sub: 'Manage and track your skills' },
  '/tasks':     { title: 'Tasks',      sub: 'Your task list and progress' },
}

export default function Topbar({ onToggleSidebar }) {
  const { pathname } = useLocation()
  const { user }     = useAuth()
  const page         = PAGE_TITLES[pathname] ?? { title: 'Own Progress', sub: '' }

  const initials = user?.username?.[0]?.toUpperCase()
    ?? user?.name?.[0]?.toUpperCase()
    ?? 'U'

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
        {/* Notification bell */}
        <button id="topbar-notifications" className="topbar__icon-btn" aria-label="Notifications">
          <Bell size={18} strokeWidth={1.8} />
          <span className="topbar__notif-dot" />
        </button>

        {/* Divider */}
        <div className="topbar__divider" />

        {/* User info */}
        <div className="topbar__user">
          <div className="topbar__user-info">
            <span className="topbar__user-name">{user?.username ?? user?.name ?? 'User'}</span>
            <span className="topbar__user-role">Member</span>
          </div>
          <div className="topbar__avatar">{initials}</div>
        </div>
      </div>
    </header>
  )
}
