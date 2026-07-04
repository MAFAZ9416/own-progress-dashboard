import React, { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Users as UsersIcon, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  X, 
  Check, 
  Globe, 
  Calendar, 
  User as UserIcon, 
  Mail, 
  FileText, 
  PlusCircle, 
  Activity, 
  History,
  Shield,
  UserCheck,
  UserX,
  AlertCircle,
  ChevronRight
} from 'lucide-react'
import { adminUsersService } from '../services/usersService'
import { useAuth } from '../../contexts/AuthContext'
import './Users.css'

export default function Users() {
  const { user: currentUser } = useAuth()
  
  // Data list & statistics states
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({
    total_users: 0,
    active_users: 0,
    staff_users: 0,
    new_users_this_month: 0
  })

  // Loading & paging states
  const [isLoading, setIsLoading] = useState(true)
  const [isAppending, setIsAppending] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  // Filters & Search
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('all')
  const [statusParam, setStatusParam] = useState('all')
  const [sort, setSort] = useState('newest')

  // Selected User for detail panel
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [userDetail, setUserDetail] = useState(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [detailTab, setDetailTab] = useState('profile') // 'profile', 'skills', 'tasks', 'activity', 'history'

  // Profile editing state
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    full_name: '',
    bio: '',
    country: '',
    role: 'user',
    is_active: true
  })
  const [editAvatarFile, setEditAvatarFile] = useState(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Delete User Confirmation Modal
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null)
  const [isDeletingUser, setIsDeletingUser] = useState(false)

  // Skill Edit Modal State
  const [editingSkill, setEditingSkill] = useState(null)
  const [skillForm, setSkillForm] = useState({ name: '', color: '#3B82F6', target_tasks: 10 })
  const [isSavingSkill, setIsSavingSkill] = useState(false)

  // Task Edit Modal State
  const [editingTask, setEditingTask] = useState(null)
  const [taskForm, setTaskForm] = useState({ title: '', description: '', status: 'pending' })
  const [isSavingTask, setIsSavingTask] = useState(false)

  const scrollContainerRef = useRef(null)

  // 1. Fetch user list from backend
  const fetchUsers = useCallback(async (pageNum = 1, isSearchOrFilter = false) => {
    if (pageNum === 1) {
      setIsLoading(true)
    } else {
      setIsAppending(true)
    }
    setError(null)

    try {
      const params = {
        page: pageNum,
        limit: 20,
        search: search.trim(),
        role,
        status: statusParam,
        sort
      }
      const data = await adminUsersService.getUsersList(params)
      
      if (pageNum === 1) {
        setUsers(data.users || [])
      } else {
        setUsers(prev => [...prev, ...(data.users || [])])
      }

      if (data.stats) {
        setStats(data.stats)
      }
      setHasMore(data.has_more || false)
      setPage(pageNum)
    } catch (err) {
      console.error(err)
      setError('Failed to retrieve user listing. Please try again.')
    } finally {
      setIsLoading(false)
      setIsAppending(false)
    }
  }, [search, role, statusParam, sort])

  // Fetch initial batch on filter change
  useEffect(() => {
    fetchUsers(1, true)
  }, [role, statusParam, sort])

  // Handle keypress/submit for search
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchUsers(1, true)
  }

  // Handle scroll trigger for infinite scrolling
  const handleScroll = () => {
    if (!scrollContainerRef.current || isAppending || !hasMore || isLoading) return
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    // Trigger when scrolled to 90% of the container height
    if (scrollTop + clientHeight >= scrollHeight - 80) {
      fetchUsers(page + 1)
    }
  };

  // 2. Fetch User Detail (drawer panel)
  const loadUserDetail = async (userId) => {
    setSelectedUserId(userId)
    setIsDetailLoading(true)
    setDetailTab('profile')
    setEditAvatarFile(null)
    
    try {
      const data = await adminUsersService.getUserDetail(userId)
      setUserDetail(data)
      // Map user details to edit form state
      setEditForm({
        username: data.user.username || '',
        email: data.user.email || '',
        full_name: data.user.profile?.full_name || '',
        bio: data.user.profile?.bio || '',
        country: data.user.profile?.country || '',
        role: data.user.is_superuser ? 'super_admin' : (data.user.is_staff ? 'staff' : 'user'),
        is_active: data.user.is_active
      })
    } catch (err) {
      console.error(err)
      alert('Failed to retrieve user detailed profile.')
    } finally {
      setIsDetailLoading(false)
    }
  }

  // 3. Save Edited Profile Info
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!selectedUserId || isSavingProfile) return
    setIsSavingProfile(true)

    try {
      const formData = new FormData()
      formData.append('username', editForm.username)
      formData.append('email', editForm.email)
      formData.append('is_active', editForm.is_active)
      formData.append('role', editForm.role)
      formData.append('profile.full_name', editForm.full_name)
      formData.append('profile.bio', editForm.bio)
      formData.append('profile.country', editForm.country)

      if (editAvatarFile) {
        formData.append('profile.avatar', editAvatarFile)
      }

      const updatedUser = await adminUsersService.updateUser(selectedUserId, formData)
      
      // Update local state in list to avoid refetch N+1 queries
      setUsers(prev => prev.map(u => u.id === selectedUserId ? { ...u, ...updatedUser } : u))
      
      // Refresh current detail widget
      setUserDetail(prev => ({
        ...prev,
        user: updatedUser
      }))

      setEditAvatarFile(null)
      alert('Profile updated successfully.')
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.detail || 'Failed to update user profile details.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  // 4. Delete User handler
  const handleDeleteUser = async () => {
    if (!deleteConfirmUser || isDeletingUser) return
    setIsDeletingUser(true)

    try {
      await adminUsersService.deleteUser(deleteConfirmUser.id)
      
      // Remove from frontend list instantly
      setUsers(prev => prev.filter(u => u.id !== deleteConfirmUser.id))
      
      // If the currently open user details is the deleted user, close the panel
      if (selectedUserId === deleteConfirmUser.id) {
        setSelectedUserId(null)
        setUserDetail(null)
      }
      
      setDeleteConfirmUser(null)
      alert('User deleted successfully.')
      // Refresh stats
      fetchUsers(1, false)
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.detail || 'Failed to delete user account.')
    } finally {
      setIsDeletingUser(false)
    }
  }

  // 5. Skills Management Handlers
  const handleOpenEditSkill = (skill) => {
    setEditingSkill(skill)
    setSkillForm({
      name: skill.name || '',
      color: skill.color || '#3B82F6',
      target_tasks: skill.target_tasks || 10
    })
  }

  const handleSaveSkill = async () => {
    if (!editingSkill || isSavingSkill) return
    setIsSavingSkill(true)

    try {
      await adminUsersService.updateUserSkill(editingSkill.id, skillForm)
      
      // Refresh user details to sync charts and metrics
      const data = await adminUsersService.getUserDetail(selectedUserId)
      setUserDetail(data)
      setEditingSkill(null)
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.detail || 'Failed to update skill parameters.')
    } finally {
      setIsSavingSkill(false)
    }
  }

  const handleDeleteSkill = async (skillId) => {
    if (!window.confirm("Are you sure you want to remove this skill from the user's list?")) return

    try {
      await adminUsersService.deleteUserSkill(skillId)
      const data = await adminUsersService.getUserDetail(selectedUserId)
      setUserDetail(data)
    } catch (err) {
      console.error(err)
      alert('Failed to delete skill.')
    }
  }

  // 6. Tasks Management Handlers
  const handleOpenEditTask = (task) => {
    setEditingTask(task)
    setTaskForm({
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'pending'
    })
  }

  const handleSaveTask = async () => {
    if (!editingTask || isSavingTask) return
    setIsSavingTask(true)

    try {
      await adminUsersService.updateUserTask(editingTask.id, taskForm)
      const data = await adminUsersService.getUserDetail(selectedUserId)
      setUserDetail(data)
      setEditingTask(null)
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.detail || 'Failed to update task records.')
    } finally {
      setIsSavingTask(false)
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task permanently?")) return

    try {
      await adminUsersService.deleteUserTask(taskId)
      const data = await adminUsersService.getUserDetail(selectedUserId)
      setUserDetail(data)
    } catch (err) {
      console.error(err)
      alert('Failed to delete task.')
    }
  }

  // Fallback for avatar image
  const defaultAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
  
  const getAvatarUrl = (userObj) => {
    const avatar = userObj?.profile?.avatar
    if (!avatar) return null
    return avatar.startsWith('http') ? avatar : `http://127.0.0.1:8000${avatar}`
  }

  const renderAvatar = (userObj) => {
    const url = getAvatarUrl(userObj)
    const initials = (userObj?.profile?.full_name || userObj?.username || '?')
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

    if (url) {
      return (
        <div className="admin-users-avatar-wrapper">
          <img src={url} alt="Profile" className="admin-users-avatar-img" onError={(e) => { e.target.style.display = 'none' }} />
          <span>{initials}</span>
        </div>
      )
    }
    return (
      <div className="admin-users-avatar-wrapper">
        <span>{initials}</span>
      </div>
    )
  }

  return (
    <div className="admin-users-content">
      {/* 1. Header Stats Grid */}
      <div className="admin-users-stats-grid">
        <div className="admin-users-stat-card admin-glow-card">
          <div className="admin-users-stat-card__icon-wrapper">
            <UsersIcon size={24} />
          </div>
          <div className="admin-users-stat-card__info">
            <span className="admin-users-stat-card__title">Total Users</span>
            <span className="admin-users-stat-card__value">{stats.total_users.toLocaleString()}</span>
          </div>
        </div>

        <div className="admin-users-stat-card admin-glow-card">
          <div className="admin-users-stat-card__icon-wrapper">
            <UserCheck size={24} />
          </div>
          <div className="admin-users-stat-card__info">
            <span className="admin-users-stat-card__title">Active Users</span>
            <span className="admin-users-stat-card__value">{stats.active_users.toLocaleString()}</span>
          </div>
        </div>

        <div className="admin-users-stat-card admin-glow-card">
          <div className="admin-users-stat-card__icon-wrapper">
            <Shield size={24} />
          </div>
          <div className="admin-users-stat-card__info">
            <span className="admin-users-stat-card__title">Staff Users</span>
            <span className="admin-users-stat-card__value">{stats.staff_users.toLocaleString()}</span>
          </div>
        </div>

        <div className="admin-users-stat-card admin-glow-card">
          <div className="admin-users-stat-card__icon-wrapper">
            <Calendar size={24} />
          </div>
          <div className="admin-users-stat-card__info">
            <span className="admin-users-stat-card__title">New This Month</span>
            <span className="admin-users-stat-card__value">{stats.new_users_this_month.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Table + sliding detail panel layout wrapper */}
      <div className={`admin-users-wrapper-with-panel ${selectedUserId ? 'panel-open' : ''}`}>
        
        {/* Left Side: Users list table card */}
        <div className="admin-users-table-card admin-glow-card">
          {/* Filter Bar */}
          <form className="admin-users-filter-bar" onSubmit={handleSearchSubmit}>
            <div className="admin-users-filter-bar__left">
              <div className="admin-users-search-wrapper">
                <Search size={16} className="admin-users-search-icon" />
                <input 
                  type="text" 
                  placeholder="Search name, email, username..." 
                  className="admin-users-search-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                className="admin-users-select"
              >
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="staff">Staff</option>
                <option value="super_admin">Super Admin</option>
              </select>

              <select 
                value={statusParam} 
                onChange={(e) => setStatusParam(e.target.value)}
                className="admin-users-select"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <select 
                value={sort} 
                onChange={(e) => setSort(e.target.value)}
                className="admin-users-select"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="recently_active">Recently Active</option>
              </select>
            </div>
            
            <button type="submit" style={{ display: 'none' }}>Submit</button>
          </form>

          {/* Desktop Table View */}
          <div 
            className="admin-users-scroll-container" 
            ref={scrollContainerRef}
            onScroll={handleScroll}
          >
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', gap: '1rem', width: '100%' }}>
                <div className="admin-users-spinner" style={{ width: '32px', height: '32px' }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--admin-text-secondary)' }}>Loading enterprise user records...</span>
              </div>
            ) : users.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', gap: '0.5rem', width: '100%' }}>
                <AlertCircle size={32} style={{ color: 'var(--admin-text-muted)' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--admin-text-primary)' }}>No Users Found</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--admin-text-secondary)' }}>No records match your selected search criteria.</span>
              </div>
            ) : (
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined Date</th>
                    <th>Last Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const isSuper = u.is_superuser
                    const isStaff = u.is_staff
                    let roleClass = 'admin-users-badge--user'
                    let roleDisplay = 'User'
                    if (isSuper) {
                      roleClass = 'admin-users-badge--super-admin'
                      roleDisplay = 'Super Admin'
                    } else if (isStaff) {
                      roleClass = 'admin-users-badge--staff'
                      roleDisplay = 'Staff'
                    }

                    return (
                      <tr 
                        key={u.id}
                        className={selectedUserId === u.id ? 'active-selected' : ''}
                        onClick={() => loadUserDetail(u.id)}
                      >
                        <td>
                          <div className="admin-users-identity-cell">
                            {renderAvatar(u)}
                            <div className="admin-users-identity-info">
                              <span className="admin-users-name">{u.profile?.full_name || 'No Name Set'}</span>
                              <span className="admin-users-email">{u.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace' }}>{u.username}</span>
                        </td>
                        <td>
                          <span className={`admin-users-badge ${roleClass}`}>{roleDisplay}</span>
                        </td>
                        <td>
                          <span className={`admin-users-badge ${u.is_active ? 'admin-users-badge--active' : 'admin-users-badge--inactive'}`}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: 'var(--admin-text-secondary)' }}>
                            {u.joined_date ? u.joined_date.split(' ')[0] : 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: 'var(--admin-text-secondary)' }}>
                            {u.last_login ? u.last_login.split(' ')[0] : 'Never'}
                          </span>
                        </td>
                        <td>
                          <div className="admin-users-actions-group" onClick={(e) => e.stopPropagation()}>
                            <button 
                              className="admin-users-action-btn"
                              title="View Details"
                              onClick={() => loadUserDetail(u.id)}
                            >
                              <Eye size={14} />
                            </button>
                            
                            <button 
                              className="admin-users-action-btn"
                              title="Edit Profile"
                              onClick={() => {
                                loadUserDetail(u.id)
                                setDetailTab('profile')
                              }}
                            >
                              <Edit2 size={14} />
                            </button>

                            <button 
                              className="admin-users-action-btn admin-users-action-btn--delete"
                              title="Delete User"
                              disabled={u.is_superuser && !currentUser?.is_superuser}
                              onClick={() => setDeleteConfirmUser(u)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}

            {isAppending && (
              <div className="admin-users-infinite-sentinel">
                <div className="admin-users-spinner" />
              </div>
            )}
          </div>

          {/* Mobile Optimized Cards List View */}
          <div className="admin-users-mobile-list">
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', gap: '0.5rem' }}>
                <div className="admin-users-spinner" />
                <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)' }}>Loading users...</span>
              </div>
            ) : users.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--admin-text-secondary)' }}>No matching users found.</span>
              </div>
            ) : (
              users.map(u => (
                <div 
                  key={u.id}
                  className="admin-users-mobile-card admin-glow-card"
                  onClick={() => loadUserDetail(u.id)}
                >
                  <div className="admin-users-mobile-card__left">
                    {renderAvatar(u)}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <span className="admin-users-name" style={{ fontSize: '0.8125rem' }}>
                        {u.profile?.full_name || u.username}
                      </span>
                      <span className="admin-users-email" style={{ fontSize: '0.7rem' }}>
                        {u.email}
                      </span>
                      <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.15rem' }}>
                        <span className="admin-users-badge admin-users-badge--user" style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem' }}>
                          {u.is_superuser ? 'Super Admin' : (u.is_staff ? 'Staff' : 'User')}
                        </span>
                        <span className={`admin-users-badge ${u.is_active ? 'admin-users-badge--active' : 'admin-users-badge--inactive'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem' }}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--admin-text-muted)' }} />
                </div>
              ))
            )}
            
            {hasMore && !isAppending && (
              <button 
                onClick={() => fetchUsers(page + 1)}
                className="admin-users-btn-secondary"
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
              >
                Load More Users
              </button>
            )}
            {isAppending && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                <div className="admin-users-spinner" />
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Sliding Detail Panel */}
        {selectedUserId && (
          <div className="admin-users-detail-panel admin-glow-card">
            <div className="admin-users-detail-panel__header">
              <h3 className="admin-users-detail-panel__title">User Details</h3>
              <button 
                className="admin-users-detail-panel__close-btn"
                onClick={() => {
                  setSelectedUserId(null)
                  setUserDetail(null)
                }}
              >
                <X size={18} />
              </button>
            </div>

            {isDetailLoading || !userDetail ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, gap: '1rem' }}>
                <div className="admin-users-spinner" />
                <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)' }}>Retrieving detail record...</span>
              </div>
            ) : (
              <>
                <div className="admin-users-detail-panel__content">
                  {/* Widget Profile summary */}
                  <div className="admin-users-detail-header-card">
                    {renderAvatar(userDetail.user)}
                    <div className="admin-users-detail-header-info">
                      <span className="admin-users-detail-header-name">
                        {userDetail.user.profile?.full_name || 'No Name'}
                      </span>
                      <span className="admin-users-detail-header-email">{userDetail.user.email}</span>
                      <div className="admin-users-detail-header-badges">
                        <span className={`admin-users-badge ${userDetail.user.is_superuser ? 'admin-users-badge--super-admin' : (userDetail.user.is_staff ? 'admin-users-badge--staff' : 'admin-users-badge--user')}`}>
                          {userDetail.user.role_display}
                        </span>
                        <span className={`admin-users-badge ${userDetail.user.is_active ? 'admin-users-badge--active' : 'admin-users-badge--inactive'}`}>
                          {userDetail.user.status_display}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Panel navigation tabs */}
                  <div className="admin-users-tabs-bar">
                    <button 
                      className={`admin-users-tab-btn ${detailTab === 'profile' ? 'active' : ''}`}
                      onClick={() => setDetailTab('profile')}
                    >
                      Profile
                    </button>
                    <button 
                      className={`admin-users-tab-btn ${detailTab === 'skills' ? 'active' : ''}`}
                      onClick={() => setDetailTab('skills')}
                    >
                      Skills
                    </button>
                    <button 
                      className={`admin-users-tab-btn ${detailTab === 'tasks' ? 'active' : ''}`}
                      onClick={() => setDetailTab('tasks')}
                    >
                      Tasks
                    </button>
                    <button 
                      className={`admin-users-tab-btn ${detailTab === 'activity' ? 'active' : ''}`}
                      onClick={() => setDetailTab('activity')}
                    >
                      Activity
                    </button>
                    <button 
                      className={`admin-users-tab-btn ${detailTab === 'history' ? 'active' : ''}`}
                      onClick={() => setDetailTab('history')}
                    >
                      History
                    </button>
                  </div>

                  {/* Profile Editing Pane */}
                  {detailTab === 'profile' && (
                    <form className="admin-users-tab-pane" onSubmit={handleSaveProfile}>
                      <div className="admin-users-avatar-edit-row">
                        {renderAvatar(userDetail.user)}
                        <div className="admin-users-image-upload-btn">
                          <span>Change Image</span>
                          <input 
                            type="file" 
                            accept="image/*"
                            className="admin-users-image-upload-input"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setEditAvatarFile(e.target.files[0])
                              }
                            }}
                          />
                        </div>
                        {editAvatarFile && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--admin-status-success)' }}>
                            Selected: {editAvatarFile.name}
                          </span>
                        )}
                      </div>

                      <div className="admin-users-form-group">
                        <label className="admin-users-form-label">Full Name</label>
                        <input 
                          type="text" 
                          className="admin-users-form-input"
                          value={editForm.full_name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                        />
                      </div>

                      <div className="admin-users-form-group">
                        <label className="admin-users-form-label">Username</label>
                        <input 
                          type="text" 
                          className="admin-users-form-input"
                          value={editForm.username}
                          onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                        />
                      </div>

                      <div className="admin-users-form-group">
                        <label className="admin-users-form-label">Email Address</label>
                        <input 
                          type="email" 
                          className="admin-users-form-input"
                          value={editForm.email}
                          onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>

                      <div className="admin-users-form-group">
                        <label className="admin-users-form-label">Country</label>
                        <input 
                          type="text" 
                          className="admin-users-form-input"
                          value={editForm.country}
                          onChange={(e) => setEditForm(prev => ({ ...prev, country: e.target.value }))}
                        />
                      </div>

                      <div className="admin-users-form-group">
                        <label className="admin-users-form-label">Bio / About</label>
                        <textarea 
                          className="admin-users-form-textarea"
                          value={editForm.bio}
                          onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                        />
                      </div>

                      <div className="admin-users-form-group">
                        <label className="admin-users-form-label">Role</label>
                        <select 
                          className="admin-users-select"
                          style={{ width: '100%' }}
                          value={editForm.role}
                          disabled={userDetail.user.is_superuser && !currentUser?.is_superuser}
                          onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                        >
                          <option value="user">User (Learner)</option>
                          <option value="staff">Staff Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      </div>

                      <div className="admin-users-form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <input 
                          type="checkbox" 
                          id="edit-is-active"
                          checked={editForm.is_active}
                          disabled={userDetail.user.is_superuser && !currentUser?.is_superuser}
                          onChange={(e) => setEditForm(prev => ({ ...prev, is_active: e.target.checked }))}
                        />
                        <label htmlFor="edit-is-active" className="admin-users-form-label" style={{ margin: 0, cursor: 'pointer' }}>
                          Account Active State
                        </label>
                      </div>

                      <div className="admin-users-form-actions">
                        <button 
                          type="submit" 
                          className="admin-users-btn-primary"
                          disabled={isSavingProfile}
                        >
                          {isSavingProfile ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Skills Management Pane */}
                  {detailTab === 'skills' && (
                    <div className="admin-users-tab-pane">
                      {userDetail.skills && userDetail.skills.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--admin-text-secondary)', padding: '2rem' }}>
                          No skills created by this user yet.
                        </div>
                      ) : (
                        <div className="admin-users-detail-list">
                          {userDetail.skills.map(skill => (
                            <div key={skill.id} className="admin-users-list-card">
                              <div className="admin-users-list-card__left">
                                <div className="admin-users-list-card__title-row">
                                  <span className="admin-users-list-card__dot" style={{ backgroundColor: skill.color }} />
                                  <span className="admin-users-list-card__title">{skill.name}</span>
                                </div>
                                <span className="admin-users-list-card__subinfo">
                                  Progress: {skill.progress}% ({skill.completed_tasks}/{skill.total_tasks} tasks)
                                </span>
                                <div className="admin-users-progress-track">
                                  <div className="admin-users-progress-fill" style={{ width: `${skill.progress}%`, backgroundColor: skill.color }} />
                                </div>
                              </div>
                              <div className="admin-users-actions-group">
                                <button 
                                  className="admin-users-action-btn"
                                  onClick={() => handleOpenEditSkill(skill)}
                                  title="Edit Skill Parameters"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button 
                                  className="admin-users-action-btn admin-users-action-btn--delete"
                                  onClick={() => handleDeleteSkill(skill.id)}
                                  title="Delete Skill"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tasks Management Pane */}
                  {detailTab === 'tasks' && (
                    <div className="admin-users-tab-pane">
                      {userDetail.tasks && userDetail.tasks.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--admin-text-secondary)', padding: '2rem' }}>
                          No tasks created by this user yet.
                        </div>
                      ) : (
                        <div className="admin-users-detail-list">
                          {userDetail.tasks.map(task => (
                            <div key={task.id} className="admin-users-list-card">
                              <div className="admin-users-list-card__left">
                                <span className="admin-users-list-card__title">{task.title}</span>
                                {task.description && (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)' }}>
                                    {task.description}
                                  </span>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                                  <span className={`admin-users-badge admin-users-task-badge ${task.status === 'completed' ? 'admin-users-badge--active' : 'admin-users-badge--inactive'}`}>
                                    {task.status.toUpperCase()}
                                  </span>
                                  {task.skill_name && (
                                    <span style={{ fontSize: '0.7rem', color: task.skill_color, fontWeight: 600 }}>
                                      {task.skill_name}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="admin-users-actions-group">
                                <button 
                                  className="admin-users-action-btn"
                                  onClick={() => handleOpenEditTask(task)}
                                  title="Edit Task Details"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button 
                                  className="admin-users-action-btn admin-users-action-btn--delete"
                                  onClick={() => handleDeleteTask(task.id)}
                                  title="Delete Task"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Activity Tab Pane */}
                  {detailTab === 'activity' && (
                    <div className="admin-users-tab-pane">
                      {userDetail.activity_logs && userDetail.activity_logs.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--admin-text-secondary)', padding: '2rem' }}>
                          No activity log logs captured for this user.
                        </div>
                      ) : (
                        <div className="admin-users-activity-timeline">
                          {userDetail.activity_logs.map(log => (
                            <div key={log.id} className="admin-users-activity-node">
                              <div className="admin-users-activity-card">
                                <span className="admin-users-activity-text">{log.action}</span>
                                <span className="admin-users-activity-time">{log.created_at}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* History Timeline Tab */}
                  {detailTab === 'history' && (
                    <div className="admin-users-tab-pane">
                      <div className="admin-users-activity-timeline">
                        {userDetail.history && userDetail.history.map((hist, idx) => (
                          <div key={idx} className="admin-users-activity-node">
                            <div className="admin-users-activity-card">
                              <span className="admin-users-activity-text" style={{ fontWeight: 600 }}>
                                {hist.event}
                              </span>
                              <span className="admin-users-activity-time">{hist.timestamp}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
                
                {/* Fixed Footer Buttons for mobile bottom sheets */}
                <div 
                  className="admin-users-form-actions" 
                  style={{ 
                    borderTop: '1px solid var(--admin-border-color)', 
                    padding: '1rem 1.5rem', 
                    background: 'rgba(7, 8, 14, 0.3)',
                    marginTop: 'auto'
                  }}
                >
                  <button 
                    onClick={() => {
                      if (userDetail.user.is_superuser && !currentUser?.is_superuser) {
                        alert("Only super admins can delete super admin accounts.");
                        return
                      }
                      setDeleteConfirmUser(userDetail.user)
                    }}
                    className="admin-users-btn-secondary"
                    style={{ 
                      borderColor: 'rgba(239, 68, 68, 0.4)', 
                      color: 'var(--admin-status-danger)',
                      marginRight: 'auto'
                    }}
                    disabled={userDetail.user.is_superuser && !currentUser?.is_superuser}
                  >
                    Delete Account
                  </button>
                </div>
              </>
            )}
          </div>
        )}

      </div>

      {/* 2. Delete User Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="admin-users-modal-overlay">
          <div className="admin-users-modal admin-glow-card">
            <div className="admin-users-modal__header">
              <h3 className="admin-users-modal__title">Delete Account</h3>
              <button 
                onClick={() => setDeleteConfirmUser(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--admin-text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="admin-users-modal__content" style={{ paddingBottom: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--admin-text-primary)', margin: 0, lineHeight: 1.5 }}>
                Are you sure you want to delete user <strong>{deleteConfirmUser.profile?.full_name || deleteConfirmUser.username}</strong>?
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)', margin: '0.5rem 0 0 0', lineHeight: 1.4 }}>
                This action is permanent and will completely remove all their tasks, skills, streaks, activity logs, and account records from the database.
              </p>
            </div>
            <div className="admin-users-modal__footer">
              <button 
                className="admin-users-btn-secondary" 
                onClick={() => setDeleteConfirmUser(null)}
              >
                Cancel
              </button>
              <button 
                className="admin-users-btn-primary" 
                style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
                disabled={isDeletingUser}
                onClick={handleDeleteUser}
              >
                {isDeletingUser ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Skill Edit Inline Modal */}
      {editingSkill && (
        <div className="admin-users-modal-overlay">
          <div className="admin-users-modal admin-glow-card">
            <div className="admin-users-modal__header">
              <h3 className="admin-users-modal__title">Edit Skill</h3>
              <button onClick={() => setEditingSkill(null)} style={{ background: 'transparent', border: 'none', color: 'var(--admin-text-secondary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div className="admin-users-modal__content">
              <div className="admin-users-form-group">
                <label className="admin-users-form-label">Skill Name</label>
                <input 
                  type="text" 
                  className="admin-users-form-input"
                  value={skillForm.name}
                  onChange={(e) => setSkillForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="admin-users-form-group">
                <label className="admin-users-form-label">Target Tasks</label>
                <input 
                  type="number" 
                  className="admin-users-form-input"
                  value={skillForm.target_tasks}
                  onChange={(e) => setSkillForm(prev => ({ ...prev, target_tasks: parseInt(e.target.value) || 1 }))}
                />
              </div>

              <div className="admin-users-form-group">
                <label className="admin-users-form-label">Theme Color</label>
                <div className="admin-users-color-picker-row">
                  {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map(c => (
                    <div 
                      key={c}
                      className={`admin-users-color-swatch ${skillForm.color === c ? 'selected' : ''}`}
                      style={{ backgroundColor: c, color: c }}
                      onClick={() => setSkillForm(prev => ({ ...prev, color: c }))}
                    >
                      {skillForm.color === c && <Check size={12} style={{ color: '#fff' }} />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="admin-users-modal__footer">
              <button className="admin-users-btn-secondary" onClick={() => setEditingSkill(null)}>
                Cancel
              </button>
              <button 
                className="admin-users-btn-primary" 
                onClick={handleSaveSkill}
                disabled={isSavingSkill}
              >
                {isSavingSkill ? 'Saving...' : 'Save Skill'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Task Edit Inline Modal */}
      {editingTask && (
        <div className="admin-users-modal-overlay">
          <div className="admin-users-modal admin-glow-card">
            <div className="admin-users-modal__header">
              <h3 className="admin-users-modal__title">Edit Task</h3>
              <button onClick={() => setEditingTask(null)} style={{ background: 'transparent', border: 'none', color: 'var(--admin-text-secondary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div className="admin-users-modal__content">
              <div className="admin-users-form-group">
                <label className="admin-users-form-label">Task Title</label>
                <input 
                  type="text" 
                  className="admin-users-form-input"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="admin-users-form-group">
                <label className="admin-users-form-label">Description</label>
                <textarea 
                  className="admin-users-form-textarea"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="admin-users-form-group">
                <label className="admin-users-form-label">Completion Status</label>
                <select 
                  className="admin-users-select"
                  style={{ width: '100%' }}
                  value={taskForm.status}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <div className="admin-users-modal__footer">
              <button className="admin-users-btn-secondary" onClick={() => setEditingTask(null)}>
                Cancel
              </button>
              <button 
                className="admin-users-btn-primary" 
                onClick={handleSaveTask}
                disabled={isSavingTask}
              >
                {isSavingTask ? 'Saving...' : 'Save Task'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
