import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, ClipboardList, LineChart, MoreHorizontal } from 'lucide-react'
import './BottomNavigation.css'

export default function BottomNavigation({ onToggleMore }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { id: 'users', label: 'Users', icon: Users, path: '/admin/users' },
    { id: 'tasks', label: 'Tasks', icon: ClipboardList, path: '/admin/tasks' },
    { id: 'analytics', label: 'Analytics', icon: LineChart, path: '/admin/analytics' },
  ]

  return (
    <nav className="admin-bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.id}
            to={item.path}
            id={`admin-mobile-nav-${item.id}`}
            className={({ isActive }) =>
              `admin-bottom-nav__item ${isActive ? 'admin-bottom-nav__item--active' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                <span className="admin-bottom-nav__label">{item.label}</span>
              </>
            )}
          </NavLink>
        )
      })}
      
      {/* More Button to trigger the sidebar overlay drawer */}
      <button
        onClick={onToggleMore}
        className="admin-bottom-nav__item admin-bottom-nav__item--more"
        id="admin-mobile-nav-more"
      >
        <MoreHorizontal size={20} strokeWidth={1.8} />
        <span className="admin-bottom-nav__label">More</span>
      </button>
    </nav>
  )
}
