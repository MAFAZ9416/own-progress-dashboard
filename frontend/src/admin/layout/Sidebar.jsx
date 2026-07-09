import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { NAVIGATION_ITEMS } from '../config/navigation'
import { LogOut } from 'lucide-react'
import { getMediaUrl } from '../../api'
import './Sidebar.css'

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  
  const handleLogout = () => {
    logout()
  }

  // Fallback for avatar image
  const defaultAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
  const avatarSrc = user?.avatar
    ? getMediaUrl(user.avatar)
    : defaultAvatar

  return (
    <aside className={`admin-sidebar ${isOpen ? 'admin-sidebar--open' : ''}`}>
      {/* Brand Logo & Enterprise Badge */}
      <div className="admin-sidebar__brand">
        <div className="admin-sidebar__logo-container">
          <img 
            src="/logo.png" 
            alt="Progressly" 
            className="admin-sidebar__logo" 
            onError={(e) => { e.target.src = "/logo.png" }}
          />
          <span className="admin-sidebar__brand-name">Progressly</span>
        </div>
        <div className="admin-sidebar__badge-container">
          <span className="admin-sidebar__badge">ENTERPRISE</span>
        </div>
      </div>

      {/* Nav List */}
      <div className="admin-sidebar__nav-wrapper">
        <nav className="admin-sidebar__nav">
          {(() => {
            const [dynamicCount, setDynamicCount] = React.useState(0)

            const loadCount = React.useCallback(async () => {
              try {
                const { adminNotificationsService } = await import('../services/notificationsService')
                const data = await adminNotificationsService.getNotificationsList()
                setDynamicCount((data.notifications || []).length)
              } catch (err) {
                // Fail silently to avoid interrupting sidebar UI
              }
            }, [])

            React.useEffect(() => {
              loadCount()
              window.addEventListener('notification-changed', loadCount)
              return () => {
                window.removeEventListener('notification-changed', loadCount)
              }
            }, [loadCount])

            return NAVIGATION_ITEMS.map((item) => {
              const Icon = item.icon
              const hasBadge = item.id === 'notifications' && dynamicCount > 0
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  id={`admin-nav-${item.id}`}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `admin-sidebar__nav-item ${isActive ? 'admin-sidebar__nav-item--active' : ''}`
                  }
                >
                  <span className="admin-sidebar__nav-icon">
                    <Icon size={18} strokeWidth={1.8} />
                  </span>
                  <span className="admin-sidebar__nav-label">{item.label}</span>
                  {hasBadge && (
                    <span className="admin-sidebar__nav-badge">{dynamicCount}</span>
                  )}
                </NavLink>
              )
            })
          })()}
        </nav>
      </div>

      {/* Profile Card & Logout (Static Sidebar Profile, Chevron Removed) */}
      <div className="admin-sidebar__footer">
        <div className="admin-sidebar__profile">
          <div className="admin-sidebar__avatar-container">
            <img
              src={avatarSrc}
              alt="Admin Avatar"
              className="admin-sidebar__avatar"
              onError={(e) => {
                e.target.src = defaultAvatar
              }}
            />
          </div>
          <div className="admin-sidebar__profile-info">
            <span className="admin-sidebar__profile-name">
              {user?.full_name || "Admin User"}
            </span>
            <span className="admin-sidebar__profile-role">
              {user?.is_superuser ? "Super Admin" : "Staff Admin"}
            </span>
          </div>
        </div>

        {/* Online Status and Logout Row */}
        <div className="admin-sidebar__status-row">
          <div className="admin-sidebar__status">
            <span className="admin-sidebar__status-dot"></span>
            <span className="admin-sidebar__status-text">Online</span>
          </div>
          <button 
            onClick={handleLogout} 
            className="admin-sidebar__logout"
            id="admin-logout-btn"
            title="Sign Out"
          >
            <LogOut size={14} strokeWidth={2} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
