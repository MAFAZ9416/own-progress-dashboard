import { useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const PAGE_TITLES = {
  '/dashboard': { title: 'Dashboard',  sub: 'Overview of your progress' },
  '/skills':    { title: 'Skills',     sub: 'Manage and track your skills' },
  '/tasks':     { title: 'Tasks',      sub: 'Your task list and progress' },
}

export default function Topbar() {
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
        <h1 className="topbar__title">{page.title}</h1>
        {page.sub && <p className="topbar__sub">{page.sub}</p>}
      </div>

      {/* Right: actions + avatar */}
      <div className="topbar__right">
        {/* Notification bell */}
        <button id="topbar-notifications" className="topbar__icon-btn" aria-label="Notifications">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
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
