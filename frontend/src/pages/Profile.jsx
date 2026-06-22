import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useDashboard } from '../hooks/useDashboard'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { User, Mail, Calendar, Brain, ClipboardList, CheckCircle, Clock, Flame, Star, BarChart, LogOut, PlusCircle, Target } from 'lucide-react'
import './Profile.css'

export default function Profile() {
  const { user, logout } = useAuth()
  const { summary, recent, isLoading } = useDashboard()
  
  const isMobile = useMediaQuery('(max-width: 767px)')
  const activityLimit = isMobile ? 3 : 5

  const displayName = user?.username ?? user?.first_name ?? 'User'
  const email = user?.email ?? 'No email provided'
  const initials = displayName?.[0]?.toUpperCase() ?? '?'
  
  const joinDate = user?.date_joined 
    ? new Date(user.date_joined).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown date'

  const totalTasks = summary?.total_tasks ?? 0
  const completedTasks = summary?.tasks_done ?? 0
  const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(0) : 0

  return (
    <div className="profile-page">
      {/* Hero Profile Card */}
      <div className="profile-hero">
        <div className="profile-hero-content">
          <div className="profile-avatar-container">
            <div className="profile-avatar">{initials}</div>
            <div className="profile-status-indicator"></div>
          </div>
          <div className="profile-hero-info">
            <h1 className="profile-username">{displayName}</h1>
            <p className="profile-email">{email}</p>
            <p className="profile-member-since">
              <Calendar size={14} className="profile-icon" />
              Member since {joinDate}
            </p>
          </div>
          <button className="profile-edit-button">
            <User size={14} /> Edit Profile
          </button>
        </div>
        <div className="profile-hero-wave"></div>
      </div>

      {/* Statistics Section */}
      <div className="profile-stats-grid">
        <div className="profile-stat-card">
          <div className="profile-stat-icon-wrapper type-primary">
            <Brain size={20} />
          </div>
          <div className="profile-stat-data">
            <span className="profile-stat-value">{isLoading ? '...' : (summary?.total_skills ?? 0)}</span>
            <span className="profile-stat-label">Total Skills</span>
          </div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-icon-wrapper type-secondary">
            <ClipboardList size={20} />
          </div>
          <div className="profile-stat-data">
            <span className="profile-stat-value">{isLoading ? '...' : totalTasks}</span>
            <span className="profile-stat-label">Total Tasks</span>
          </div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-icon-wrapper type-success">
            <CheckCircle size={20} />
          </div>
          <div className="profile-stat-data">
            <span className="profile-stat-value">{isLoading ? '...' : completedTasks}</span>
            <span className="profile-stat-label">Completed</span>
          </div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-icon-wrapper type-warning">
            <Clock size={20} />
          </div>
          <div className="profile-stat-data">
            <span className="profile-stat-value">{isLoading ? '...' : (totalTasks - completedTasks)}</span>
            <span className="profile-stat-label">Pending</span>
          </div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-icon-wrapper type-danger">
            <Flame size={20} />
          </div>
          <div className="profile-stat-data">
            <span className="profile-stat-value">{isLoading ? '...' : (summary?.current_streak ?? 0)} {summary?.current_streak === 1 ? 'Day' : 'Days'}</span>
            <span className="profile-stat-label">Current Streak</span>
          </div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-icon-wrapper type-primary">
            <Star size={20} />
          </div>
          <div className="profile-stat-data">
            <span className="profile-stat-value">{isLoading ? '...' : (summary?.longest_streak ?? 0)} {summary?.longest_streak === 1 ? 'Day' : 'Days'}</span>
            <span className="profile-stat-label">Best Streak</span>
          </div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-icon-wrapper type-secondary">
            <BarChart size={20} />
          </div>
          <div className="profile-stat-data">
            <span className="profile-stat-value">{isLoading ? '...' : `${completionRate}%`}</span>
            <span className="profile-stat-label">Completion Rate</span>
          </div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-icon-wrapper type-primary">
            <Target size={20} />
          </div>
          <div className="profile-stat-data">
            <span className="profile-stat-value">{isLoading ? '...' : (recent?.length ?? 0)}</span>
            <span className="profile-stat-label">Total Activity</span>
          </div>
        </div>
      </div>

      <div className="profile-main-grid">
        {/* Account Information Card */}
        <div className="profile-card profile-account">
          <h2 className="profile-card-title">
            <User size={18} /> Account Information
          </h2>
          <div className="profile-account-list">
            <div className="profile-account-item">
              <span className="profile-account-label"><User size={16} /> Username</span>
              <span className="profile-account-value">{displayName}</span>
            </div>
            <div className="profile-account-item">
              <span className="profile-account-label"><Mail size={16} /> Email</span>
              <span className="profile-account-value">{email}</span>
            </div>
            <div className="profile-account-item">
              <span className="profile-account-label"><Calendar size={16} /> Member Since</span>
              <span className="profile-account-value">{joinDate}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="profile-card profile-activity">
          <div className="profile-activity-header">
            <h2 className="profile-card-title">
              <BarChart size={18} /> Recent Activity
            </h2>
            <button className="profile-view-all">View all</button>
          </div>
          <div className="profile-activity-timeline">
            {isLoading ? (
              <p className="profile-activity-text">Loading...</p>
            ) : recent && recent.length > 0 ? (
              recent.slice(0, activityLimit).map((item, i) => (
                <div key={item.id ?? i} className="profile-activity-item">
                  <div className="profile-activity-icon">
                    {item.type === 'skill' ? <PlusCircle size={16} /> : <CheckCircle size={16} />}
                  </div>
                  <div className="profile-activity-content">
                    <p className="profile-activity-text">{item.text}</p>
                    <span className="profile-activity-time">{item.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="profile-activity-text">No recent activity yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="profile-danger">
        <h2 className="profile-danger-title">Danger Zone</h2>
        <p className="profile-danger-subtitle">These actions are irreversible. Please be careful.</p>
        <button className="profile-logout-button" onClick={logout}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  )
}
