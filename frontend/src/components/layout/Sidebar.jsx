import { memo } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LayoutDashboard, Brain, ClipboardList, LogOut, UserCircle, Settings } from 'lucide-react'
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
    label: 'Settings',
    to: '/settings',
    icon: <Settings size={18} strokeWidth={1.8} />,
  },
]

const Sidebar = memo(function Sidebar({ isOpen, onClose }) {
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
})

export default Sidebar
