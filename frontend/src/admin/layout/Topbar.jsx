import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
  Menu,
  Search,
  Bell,
  Moon,
  Sun,
  Maximize2,
  Minimize2,
  ChevronDown,
  User,
  Settings,
  LogOut
} from 'lucide-react'
import { getMediaUrl } from '../../api'
import './Topbar.css'

export default function Topbar({ onToggleSidebar }) {
  const { user, logout } = useAuth()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [isThemeDark, setIsThemeDark] = useState(true)
  const dropdownRef = useRef(null)

  // Handle Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Sync fullscreen change state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fallback avatar
  const defaultAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
  const avatarSrc = user?.avatar
    ? getMediaUrl(user.avatar)
    : defaultAvatar

  return (
    <header className="admin-topbar">
      {/* Left side: Hamburger menu + Search */}
      <div className="admin-topbar__left">
        <button 
          onClick={onToggleSidebar} 
          className="admin-topbar__hamburger"
          aria-label="Open Sidebar"
          id="admin-hamburger-btn"
        >
          <Menu size={20} strokeWidth={2} />
        </button>

        <div className="admin-topbar__search-wrapper">
          <Search size={15} className="admin-topbar__search-icon" />
          <input 
            type="text" 
            placeholder="Search anything..." 
            className="admin-topbar__search-input"
            id="admin-search-input"
          />
          <kbd className="admin-topbar__search-kbd">⌘K</kbd>
        </div>
      </div>

      {/* Right side: Global Actions & User Profile */}
      <div className="admin-topbar__right">
        {/* Notification icon */}
        <button 
          className="admin-topbar__action-btn admin-topbar__action-btn--notify" 
          aria-label="View notifications"
          id="admin-topbar-bell-btn"
        >
          <Bell size={18} strokeWidth={1.8} />
          <span className="admin-topbar__bell-badge">8</span>
        </button>

        {/* Theme toggle (visual mock) */}
        <button 
          onClick={() => setIsThemeDark(!isThemeDark)} 
          className="admin-topbar__action-btn"
          aria-label="Toggle theme mode"
          id="admin-topbar-theme-btn"
        >
          {isThemeDark ? <Moon size={18} strokeWidth={1.8} /> : <Sun size={18} strokeWidth={1.8} />}
        </button>

        {/* Fullscreen icon */}
        <button 
          onClick={toggleFullscreen} 
          className="admin-topbar__action-btn admin-topbar__action-btn--fullscreen"
          aria-label="Toggle fullscreen mode"
          id="admin-topbar-fullscreen-btn"
        >
          {isFullscreen ? <Minimize2 size={18} strokeWidth={1.8} /> : <Maximize2 size={18} strokeWidth={1.8} />}
        </button>

        {/* Small Divider */}
        <div className="admin-topbar__divider"></div>

        {/* Admin profile detail */}
        <div className="admin-topbar__profile-wrapper" ref={dropdownRef}>
          <button 
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="admin-topbar__profile-trigger"
            id="admin-topbar-profile-trigger"
          >
            <div className="admin-topbar__avatar-container">
              <img 
                src={avatarSrc} 
                alt="Profile" 
                className="admin-topbar__avatar"
                onError={(e) => { e.target.src = defaultAvatar }}
              />
            </div>
            <div className="admin-topbar__profile-details">
              <span className="admin-topbar__profile-name">
                {user?.full_name || "Admin User"}
              </span>
              <span className="admin-topbar__profile-role">
                {user?.is_superuser ? "Super Admin" : "Staff"}
              </span>
            </div>
            <ChevronDown size={14} className={`admin-topbar__profile-chevron ${isProfileDropdownOpen ? 'admin-topbar__profile-chevron--open' : ''}`} />
          </button>

          {/* Profile Dropdown panel */}
          {isProfileDropdownOpen && (
            <div className="admin-topbar__dropdown" id="admin-topbar-profile-dropdown">
              <div className="admin-topbar__dropdown-info">
                <span className="admin-topbar__dropdown-name">{user?.full_name || "Admin User"}</span>
                <span className="admin-topbar__dropdown-email">{user?.email || "admin@progressly.com"}</span>
              </div>
              <div className="admin-topbar__dropdown-divider" />
              
              <button className="admin-topbar__dropdown-item" onClick={() => setIsProfileDropdownOpen(false)}>
                <User size={14} />
                <span>My Profile</span>
              </button>
              <button className="admin-topbar__dropdown-item" onClick={() => setIsProfileDropdownOpen(false)}>
                <Settings size={14} />
                <span>Settings</span>
              </button>
              
              <div className="admin-topbar__dropdown-divider" />
              <button 
                onClick={() => {
                  setIsProfileDropdownOpen(false)
                  logout()
                }} 
                className="admin-topbar__dropdown-item admin-topbar__dropdown-item--logout"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
