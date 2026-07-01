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

        {(user?.is_staff || user?.is_superuser) && (
          <NavLink
            to="/admin"
            id="sidebar-nav-admin"
            onClick={onClose}
            className={({ isActive }) =>
              `sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`
            }
            style={{ marginTop: 'auto', borderColor: 'rgba(168, 85, 247, 0.25)' }}
          >
            <span className="sidebar__nav-icon" style={{ color: '#A855F7' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[18px] h-[18px]">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <span className="sidebar__nav-label text-purple-300 font-semibold">Admin Panel</span>
            <span className="sidebar__nav-indicator" style={{ background: '#A855F7' }} />
          </NavLink>
        )}
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
