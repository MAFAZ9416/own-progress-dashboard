import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { NAVIGATION_ITEMS } from '../config/navigation'
import { LogOut } from 'lucide-react'
import './Sidebar.css'

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  
  const handleLogout = () => {
    logout()
  }

  // Fallback for avatar image
  const defaultAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
  const avatarSrc = user?.avatar
    ? (user.avatar.startsWith('http') ? user.avatar : `http://127.0.0.1:8000${user.avatar}`)
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
          {NAVIGATION_ITEMS.map((item) => {
            const Icon = item.icon
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
                {item.badgeCount && (
                  <span className="admin-sidebar__nav-badge">{item.badgeCount}</span>
                )}
              </NavLink>
            )
          })}
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
