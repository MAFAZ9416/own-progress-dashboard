import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LayoutDashboard, Brain, ClipboardList, LogOut, UserCircle, Settings } from 'lucide-react'

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
    label: 'Settings',
    to: '/settings',
    icon: <Settings size={18} strokeWidth={1.8} />,
  },
]

export default function Sidebar({ isOpen, onClose }) {
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
        <div className="sidebar__logo">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="sidebar__brand-text">
          <span className="sidebar__brand-name">Own Progress</span>
          <span className="sidebar__brand-sub">Dashboard</span>
        </div>
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
              <img src={user.avatar.startsWith('http') ? user.avatar : `http://127.0.0.1:8000${user.avatar}`} alt={displayName} />
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

        <button
          id="sidebar-logout-btn"
          onClick={handleLogout}
          className="sidebar__logout"
        >
          <LogOut size={16} strokeWidth={1.8} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
