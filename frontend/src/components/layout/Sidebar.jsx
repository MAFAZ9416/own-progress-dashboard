import { memo } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LayoutDashboard, Brain, ClipboardList, LogOut, Settings, Bell, Trophy, User } from 'lucide-react'
import { getMediaUrl } from '../../api'

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: <LayoutDashboard size={18} strokeWidth={1.8} />,
  },
  {
    label: 'Skills',
    to: '/skills',
    icon: <Brain size={18} strokeWidth={1.8} />,
  },
  {
    label: 'Tasks',
    to: '/tasks',
    icon: <ClipboardList size={18} strokeWidth={1.8} />,
  },
  {
    label: 'Achievements',
    to: '/achievements',
    icon: <Trophy size={18} strokeWidth={1.8} />,
  },
  {
    label: 'Notifications',
    to: '/notifications',
    icon: <Bell size={18} strokeWidth={1.8} />,
  },
  {
    label: 'Settings',
    to: '/settings',
    icon: <Settings size={18} strokeWidth={1.8} />,
  },
]


import pkg from '../../../package.json'

const Sidebar = memo(function Sidebar({ isOpen, onClose, canInstall, installApp }) {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const displayName = user?.full_name ?? user?.first_name ?? ''
  const initials = displayName?.[0]?.toUpperCase() ?? '?'

  return (
    <aside id="sidebar" className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
      {/* ── Brand ── */}
      <div className="sidebar__brand">
        <img
          src="/logo.png"
          alt="Progressly"
          className="sidebar__brand-logo"
          draggable={false}
        />
      </div>

      {/* ── Nav label ── */}
      <p className="sidebar__section-label">NAVIGATION</p>

      {/* ── Nav items ── */}
      <nav className="sidebar__nav">
        {NAV_ITEMS.map(({ label, to, icon }) => (
          <NavLink
            key={to}
            to={to}
            id={`sidebar-nav-${label.toLowerCase()}`}
            onClick={onClose}
            className={({ isActive }) =>
              `sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`
            }
          >
            <span className="sidebar__nav-icon">{icon}</span>
            <span className="sidebar__nav-label">{label}</span>
            <span className="sidebar__nav-indicator" />
          </NavLink>
        ))}
      </nav>

      {/* ── Spacer ── */}
      <div className="sidebar__spacer" />

      {/* ── User card ── */}
      <div className="sidebar__user">
        <div className="sidebar__user-card">
          <div className="sidebar__avatar">
            {user?.avatar ? (
              <img src={getMediaUrl(user.avatar)} alt={displayName} />
            ) : (
              initials
            )}
          </div>
          <div className="sidebar__user-info">
            <p className="sidebar__user-name">
              {displayName}
            </p>
            <p className="sidebar__user-email">{user?.email ?? ''}</p>
          </div>
        </div>

        {canInstall && (
          <button
            onClick={installApp}
            className="sidebar__install"
            id="sidebar-pwa-install-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '10px 14px',
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
              border: '1px dashed rgba(124, 58, 237, 0.4)',
              borderRadius: '10px',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '10px',
              transition: 'all 0.2s ease',
              marginTop: '5px'
            }}
          >
            <span style={{ display: 'inline-flex', background: 'rgba(124, 58, 237, 0.15)', padding: '5px', borderRadius: '6px', color: '#a78bfa' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12l4 4 4-4"/></svg>
            </span>
            <span>Install App</span>
          </button>
        )}

        <button
          id="sidebar-logout-btn"
          onClick={handleLogout}
          className="sidebar__logout"
        >
          <LogOut size={16} strokeWidth={1.8} />
          Sign out
        </button>

        <p className="sidebar__version" style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.3)', textAlign: 'center', margin: '10px 0 0 0', fontFamily: 'monospace' }}>
          Progressly v{pkg.version || '1.1.0'}
        </p>
      </div>
    </aside>
  )
})

export default Sidebar
