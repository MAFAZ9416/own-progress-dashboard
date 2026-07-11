import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Brain, 
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
  Users as UsersIcon,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  ChevronRight
} from 'lucide-react'
import { adminSkillsService } from '../services/skillsService'
import { adminUsersService } from '../services/usersService'
import AdminMobileCard from '../components/common/AdminMobileCard'
import './Skills.css'

export default function Skills() {
  const navigate = useNavigate()

  // Skills listing state
  const [skills, setSkills] = useState([])
  const [stats, setStats] = useState({
    total_skills: 0,
    active_learners: 0,
    total_tasks: 0,
    completion_rate: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  // Users lookup for Add Skill modal
  const [usersLookup, setUsersLookup] = useState([])

  // Details drawer
  const [selectedSkillName, setSelectedSkillName] = useState(null)
  const [skillDetail, setSkillDetail] = useState(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  // Add Skill Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({
    user_id: '',
    name: '',
    color: '#3B82F6',
    target_tasks: 10
  })
  const [isCreatingSkill, setIsCreatingSkill] = useState(false)

  // Global Edit Modal
  const [editingSkillGroup, setEditingSkillGroup] = useState(null) // holds skill group object
  const [editGroupForm, setEditGroupForm] = useState({ new_name: '', color: '#3B82F6' })
  const [isSavingGlobalEdit, setIsSavingGlobalEdit] = useState(false)

  // Global Delete Confirmation Modal
  const [deleteConfirmGroup, setDeleteConfirmGroup] = useState(null) // holds skill group object
  const [isDeletingGlobal, setIsDeletingGlobal] = useState(false)

  // Single User Skill Edit Modal (within detail drawer)
  const [editingUserSkill, setEditingUserSkill] = useState(null) // holds learner object
  const [userSkillForm, setUserSkillForm] = useState({ name: '', color: '#3B82F6', target_tasks: 10 })
  const [isSavingUserSkill, setIsSavingUserSkill] = useState(false)

  // 1. Fetch grouped listing and overall stats
  const fetchSkillsList = useCallback(async (isInitial = true) => {
    if (isInitial) setIsLoading(true)
    setError(null)

    try {
      const data = await adminSkillsService.getSkillsList({ search: search.trim() })
      setSkills(data.skills || [])
      if (data.stats) {
        setStats(data.stats)
      }
    } catch (err) {
      console.error(err)
      setError('Failed to load skills management listing.')
    } finally {
      setIsLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchSkillsList(true)
  }, [search])

  // Load user choices for creation modal
  const loadUsersLookup = async () => {
    try {
      const data = await adminUsersService.getUsersList({ limit: 1000 })
      setUsersLookup(data.users || [])
      if (data.users && data.users.length > 0) {
        setAddForm(prev => ({ ...prev, user_id: data.users[0].id }))
      }
    } catch (err) {
      console.error('Failed to load user records for dropdown selection.', err)
    }
  }

  useEffect(() => {
    loadUsersLookup()
  }, [])

  // 2. Fetch Skill details (drawer layout)
  const loadSkillDetail = async (skillName) => {
    setSelectedSkillName(skillName)
    setIsDetailLoading(true)

    try {
      const data = await adminSkillsService.getSkillGroupDetail(skillName)
      setSkillDetail(data)
    } catch (err) {
      console.error(err)
      alert('Failed to load skill group details.')
    } finally {
      setIsDetailLoading(false)
    }
  }

  const handleCreateSkill = async (e) => {
    e.preventDefault()
    if (!addForm.user_id || !addForm.name.trim() || isCreatingSkill) return
    setIsCreatingSkill(true)

    try {
      await adminSkillsService.createSkill({
        user_id: addForm.user_id,
        name: addForm.name.trim(),
        color: addForm.color,
        target_tasks: addForm.target_tasks
      })
      alert('Skill assigned successfully.')
      setShowAddModal(false)
      setAddForm(prev => ({ ...prev, name: '', target_tasks: 10 }))
      fetchSkillsList(false)
      if (selectedSkillName && selectedSkillName.toLowerCase() === addForm.name.trim().toLowerCase()) {
        loadSkillDetail(selectedSkillName)
      }
    } catch (err) {
      console.error(err)
      if (err.response?.data) {
        const errorData = err.response.data
        if (typeof errorData === 'string') {
          alert(errorData)
        } else if (errorData.detail) {
          alert(errorData.detail)
        } else {
          const errorsStr = Object.entries(errorData)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join('\n')
          alert(errorsStr || 'Failed to assign skill to user.')
        }
      } else {
        alert(err.message || 'Failed to assign skill to user.')
      }
    } finally {
      setIsCreatingSkill(false)
    }
  }

  // 4. Save Global Edit Group (Rename / Recolor)
  const handleSaveGlobalEdit = async (e) => {
    e.preventDefault()
    if (!editingSkillGroup || !editGroupForm.new_name.trim() || isSavingGlobalEdit) return
    setIsSavingGlobalEdit(true)

    try {
      await adminSkillsService.globalEditSkill(
        editingSkillGroup.name,
        editGroupForm.new_name.trim(),
        editGroupForm.color
      )
      alert('Skill group renamed/recolored globally.')
      setEditingSkillGroup(null)
      fetchSkillsList(false)
      
      // If drawer is open on this group, reload it under the new name
      if (selectedSkillName && selectedSkillName.toLowerCase() === editingSkillGroup.name.toLowerCase()) {
        loadSkillDetail(editGroupForm.new_name.trim())
      }
    } catch (err) {
      console.error(err)
      alert('Failed to rename skill globally.')
    } finally {
      setIsSavingGlobalEdit(false)
    }
  }

  // 5. Save Global Delete Group
  const handleDeleteGlobalGroup = async () => {
    if (!deleteConfirmGroup || isDeletingGlobal) return
    setIsDeletingGlobal(true)

    try {
      await adminSkillsService.globalDeleteSkill(deleteConfirmGroup.name)
      alert(`Skill "${deleteConfirmGroup.name}" deleted from all users.`)
      setDeleteConfirmGroup(null)
      
      // Close drawer if it was showing this group
      if (selectedSkillName && selectedSkillName.toLowerCase() === deleteConfirmGroup.name.toLowerCase()) {
        setSelectedSkillName(null)
        setSkillDetail(null)
      }
      fetchSkillsList(false)
    } catch (err) {
      console.error(err)
      alert('Failed to delete skill group.')
    } finally {
      setIsDeletingGlobal(false)
    }
  }

  // 6. User Level constraint update (Edit single learner tasks target)
  const handleSaveUserSkill = async () => {
    if (!editingUserSkill || isSavingUserSkill) return
    setIsSavingUserSkill(true)

    try {
      await adminUsersService.updateUserSkill(editingUserSkill.skill_id, {
        name: userSkillForm.name,
        color: userSkillForm.color,
        target_tasks: userSkillForm.target_tasks
      })
      alert('Learner target tasks updated.')
      setEditingUserSkill(null)
      // Refresh current details drawer
      loadSkillDetail(selectedSkillName)
    } catch (err) {
      console.error(err)
      alert('Failed to update learner skill target.')
    } finally {
      setIsSavingUserSkill(false)
    }
  }

  // 7. Remove skill from a single user
  const handleRemoveUserSkill = async (skillId, username) => {
    if (!window.confirm(`Are you sure you want to remove this skill from ${username}?`)) return

    try {
      await adminUsersService.deleteUserSkill(skillId)
      alert('Skill removed from user.')
      
      // Refresh list & drawer
      fetchSkillsList(false)
      if (selectedSkillName) {
        // If there are no more users, the drawer load details will fail or be empty. We close it.
        try {
          await loadSkillDetail(selectedSkillName)
        } catch {
          setSelectedSkillName(null)
          setSkillDetail(null)
        }
      }
    } catch (err) {
      console.error(err)
      alert('Failed to remove user skill.')
    }
  }

  // Fallbacks
  const defaultAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
  
  const renderAvatar = (url, name) => {
    const initials = (name || '?')
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

    if (url) {
      return (
        <div className="admin-skills-avatar-wrapper">
          <img src={url} alt="Profile" className="admin-skills-avatar-img" onError={(e) => { e.target.style.display = 'none' }} />
          <span>{initials}</span>
        </div>
      )
    }
    return (
      <div className="admin-skills-avatar-wrapper">
        <span>{initials}</span>
      </div>
    )
  }

  return (
    <div className="admin-skills-content">
      {/* Stats Grid */}
      <div className="admin-skills-stats-grid">
        <div className="admin-skills-stat-card admin-glow-card">
          <div className="admin-skills-stat-card__icon-wrapper">
            <Brain size={24} />
          </div>
          <div className="admin-skills-stat-card__info">
            <span className="admin-skills-stat-card__title">Total Skills</span>
            <span className="admin-skills-stat-card__value">{stats.total_skills.toLocaleString()}</span>
          </div>
        </div>

        <div className="admin-skills-stat-card admin-glow-card">
          <div className="admin-skills-stat-card__icon-wrapper">
            <UsersIcon size={24} />
          </div>
          <div className="admin-skills-stat-card__info">
            <span className="admin-skills-stat-card__title">Active Learners</span>
            <span className="admin-skills-stat-card__value">{stats.active_learners.toLocaleString()}</span>
          </div>
        </div>

        <div className="admin-skills-stat-card admin-glow-card">
          <div className="admin-skills-stat-card__icon-wrapper">
            <FileText size={24} />
          </div>
          <div className="admin-skills-stat-card__info">
            <span className="admin-skills-stat-card__title">Total Tasks</span>
            <span className="admin-skills-stat-card__value">{stats.total_tasks.toLocaleString()}</span>
          </div>
        </div>

        <div className="admin-skills-stat-card admin-glow-card">
          <div className="admin-skills-stat-card__icon-wrapper">
            <TrendingUp size={24} />
          </div>
          <div className="admin-skills-stat-card__info">
            <span className="admin-skills-stat-card__title">Completion Rate</span>
            <span className="admin-skills-stat-card__value">{stats.completion_rate}%</span>
          </div>
        </div>
      </div>

      {/* Main grid wrapper with detail panel */}
      <div className={`admin-skills-wrapper-with-panel ${selectedSkillName ? 'panel-open' : ''}`}>
        
        {/* Table View */}
        <div className="admin-skills-table-card admin-glow-card">
          <div className="admin-skills-filter-bar">
            <div className="admin-skills-filter-bar__left">
              <div className="admin-skills-search-wrapper">
                <Search size={16} className="admin-skills-search-icon" />
                <input 
                  type="text" 
                  placeholder="Search skill name..." 
                  className="admin-skills-search-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <button 
              className="admin-skills-btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={16} />
              <span>Add Skill</span>
            </button>
          </div>

          {/* Desktop Table */}
          <div className="admin-skills-scroll-container">
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', gap: '1rem', width: '100%' }}>
                <div className="admin-skills-spinner" style={{ width: '32px', height: '32px' }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--admin-text-secondary)' }}>Loading skills summaries...</span>
              </div>
            ) : skills.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', gap: '0.5rem', width: '100%' }}>
                <Brain size={32} style={{ color: 'var(--admin-text-muted)' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--admin-text-primary)' }}>No Skills Found</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--admin-text-secondary)' }}>No matching skill records in database.</span>
              </div>
            ) : (
              <table className="admin-skills-table">
                <thead>
                  <tr>
                    <th>Skill</th>
                    <th>Total Users</th>
                    <th>Total Tasks</th>
                    <th>Completion Rate</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {skills.map(s => (
                    <tr 
                      key={s.name}
                      className={selectedSkillName === s.name ? 'active-selected' : ''}
                      onClick={() => loadSkillDetail(s.name)}
                    >
                      <td>
                        <div className="admin-skills-name-cell">
                          <span className="admin-skills-dot" style={{ backgroundColor: s.color }} />
                          <span style={{ fontWeight: 600 }}>{s.name}</span>
                        </div>
                      </td>
                      <td>
                        <span>{s.total_users} Users</span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--admin-text-secondary)' }}>{s.total_tasks} Tasks</span>
                      </td>
                      <td>
                        <div className="admin-skills-progress-wrapper">
                          <div className="admin-skills-progress-track">
                            <div 
                              className="admin-skills-progress-fill" 
                              style={{ width: `${s.completion_rate}%`, backgroundColor: s.color }}
                            />
                          </div>
                          <span className="admin-skills-progress-text">{s.completion_rate}%</span>
                        </div>
                      </td>
                      <td>
                        <div className="admin-skills-actions-group" onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="admin-skills-action-btn"
                            title="View Learners"
                            onClick={() => loadSkillDetail(s.name)}
                          >
                            <Eye size={14} />
                          </button>
                          
                          <button 
                            className="admin-skills-action-btn"
                            title="Rename globally"
                            onClick={() => {
                              setEditingSkillGroup(s)
                              setEditGroupForm({ new_name: s.name, color: s.color })
                            }}
                          >
                            <Edit2 size={14} />
                          </button>

                          <button 
                            className="admin-skills-action-btn admin-skills-action-btn--delete"
                            title="Delete globally"
                            onClick={() => setDeleteConfirmGroup(s)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Mobile Optimized Cards List */}
          <div className="admin-skills-mobile-list">
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem' }}>
                <div className="admin-skills-spinner" />
              </div>
            ) : skills.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--admin-text-secondary)' }}>
                No skills records found.
              </div>
            ) : (
              skills.map(s => (
                <AdminMobileCard
                  key={s.name}
                  title={s.name}
                  subtitle={`${s.completion_rate}% Completion Rate`}
                  icon={Brain}
                  badge={
                    <span 
                      className="skill-tag" 
                      style={{ 
                        backgroundColor: `${s.color}15`, 
                        borderColor: s.color,
                        color: s.color,
                        fontSize: '0.65rem',
                        padding: '2px 6px'
                      }}
                    >
                      Active Group
                    </span>
                  }
                  fields={[
                    { label: 'Total Users Assigned', value: `${s.total_users} Users` },
                    { label: 'Total Tasks Registry', value: `${s.total_tasks} Tasks` }
                  ]}
                  actions={[
                    { icon: Eye, label: 'View Detail', onClick: () => loadSkillDetail(s.name) },
                    { icon: Edit2, label: 'Rename', onClick: () => { setEditingSkillGroup(s); setEditGroupForm({ new_name: s.name, color: s.color }); } },
                    { icon: Trash2, label: 'Delete', onClick: () => setDeleteConfirmGroup(s), className: 'delete' }
                  ]}
                />
              ))
            )}
          </div>

        </div>

        {/* Sliding Details Drawer Panel */}
        {selectedSkillName && (
          <div className="admin-skills-detail-panel admin-glow-card">
            <div className="admin-skills-detail-panel__header">
              <h3 className="admin-skills-detail-panel__title">Skill Details</h3>
              <button 
                className="admin-skills-detail-panel__close-btn"
                onClick={() => {
                  setSelectedSkillName(null)
                  setSkillDetail(null)
                }}
              >
                <X size={18} />
              </button>
            </div>

            {isDetailLoading || !skillDetail ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, gap: '1rem' }}>
                <div className="admin-skills-spinner" />
                <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)' }}>Retrieving skill statistics...</span>
              </div>
            ) : (
              <div className="admin-skills-detail-panel__content">
                {/* Stats Panel summary card */}
                <div className="admin-skills-detail-header-card">
                  <div className="admin-skills-detail-header-title-row">
                    <span className="admin-skills-dot" style={{ backgroundColor: skillDetail.color, width: '12px', height: '12px' }} />
                    <span className="admin-skills-detail-header-name">{skillDetail.name}</span>
                  </div>
                  
                  <div className="admin-skills-detail-header-grid">
                    <div className="admin-skills-detail-header-stat">
                      <span className="admin-skills-detail-header-stat-label">👥 Learners</span>
                      <span className="admin-skills-detail-header-stat-value">{skillDetail.total_learners}</span>
                    </div>
                    <div className="admin-skills-detail-header-stat">
                      <span className="admin-skills-detail-header-stat-label">📋 Tasks</span>
                      <span className="admin-skills-detail-header-stat-value">{skillDetail.total_tasks}</span>
                    </div>
                    <div className="admin-skills-detail-header-stat">
                      <span className="admin-skills-detail-header-stat-label">✅ Completed</span>
                      <span className="admin-skills-detail-header-stat-value">{skillDetail.completed_tasks}</span>
                    </div>
                    <div className="admin-skills-detail-header-stat">
                      <span className="admin-skills-detail-header-stat-label">📈 Avg Rate</span>
                      <span className="admin-skills-detail-header-stat-value">{skillDetail.avg_completion}%</span>
                    </div>
                  </div>

                  <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-secondary)', textAlign: 'right' }}>
                    Created Group: {skillDetail.created_date || 'N/A'}
                  </span>
                </div>

                {/* Learners Ordered by progress percentage */}
                <div className="admin-skills-learners-section">
                  <h4 className="admin-skills-section-title">Learners List</h4>
                  
                  {skillDetail.learners && skillDetail.learners.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--admin-text-secondary)', padding: '2rem' }}>
                      No learners currently enrolled.
                    </div>
                  ) : (
                    skillDetail.learners.map(learner => (
                      <div key={learner.user_id} className="admin-skills-learner-card">
                        <div className="admin-skills-learner-card__left">
                          {renderAvatar(learner.avatar, learner.full_name || learner.username)}
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="admin-skills-learner-name">
                              {learner.full_name || learner.username}
                            </span>
                            <span className="admin-skills-learner-subtext">
                              Progress: {learner.progress}% ({learner.completed_tasks}/{learner.total_tasks} tasks)
                            </span>
                          </div>
                        </div>

                        <div className="admin-skills-actions-group">
                          <button 
                            className="admin-skills-action-btn"
                            title="View User details"
                            onClick={() => navigate('/admin/users')}
                          >
                            <UserIcon size={12} />
                          </button>
                          
                          <button 
                            className="admin-skills-action-btn"
                            title="Edit Target Tasks"
                            onClick={() => {
                              setEditingUserSkill(learner)
                              setUserSkillForm({
                                name: skillDetail.name,
                                color: skillDetail.color,
                                target_tasks: learner.target_tasks
                              })
                            }}
                          >
                            <Edit2 size={12} />
                          </button>

                          <button 
                            className="admin-skills-action-btn admin-skills-action-btn--delete"
                            title="Remove Skill from User"
                            onClick={() => handleRemoveUserSkill(learner.skill_id, learner.username)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* MODALS SECTION */}

      {/* 1. Add Skill to a user */}
      {showAddModal && (
        <div className="admin-skills-modal-overlay">
          <form className="admin-skills-modal admin-glow-card" onSubmit={handleCreateSkill}>
            <div className="admin-skills-modal__header">
              <h3 className="admin-skills-modal__title">Assign Skill</h3>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--admin-text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="admin-skills-modal__content">
              <div className="admin-skills-form-group">
                <label className="admin-skills-form-label">Select Learner</label>
                <select 
                  className="admin-skills-select"
                  value={addForm.user_id}
                  onChange={(e) => setAddForm(prev => ({ ...prev, user_id: parseInt(e.target.value) || '' }))}
                >
                  {usersLookup.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.profile?.full_name ? `${u.profile.full_name} (@${u.username})` : u.username}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-skills-form-group">
                <label className="admin-skills-form-label">Skill Name</label>
                <input 
                  type="text" 
                  className="admin-skills-form-input"
                  required
                  placeholder="e.g. Python, Docker..."
                  value={addForm.name}
                  onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="admin-skills-form-group">
                <label className="admin-skills-form-label">Target Tasks</label>
                <input 
                  type="number" 
                  className="admin-skills-form-input"
                  min="1"
                  required
                  value={addForm.target_tasks}
                  onChange={(e) => setAddForm(prev => ({ ...prev, target_tasks: parseInt(e.target.value) || 1 }))}
                />
              </div>

              <div className="admin-skills-form-group">
                <label className="admin-skills-form-label">Theme Color</label>
                <div className="admin-skills-color-picker-row">
                  {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map(c => (
                    <div 
                      key={c}
                      className={`admin-skills-color-swatch ${addForm.color === c ? 'selected' : ''}`}
                      style={{ backgroundColor: c, color: c }}
                      onClick={() => setAddForm(prev => ({ ...prev, color: c }))}
                    >
                      {addForm.color === c && <Check size={12} style={{ color: '#fff' }} />}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="admin-skills-modal__footer">
              <button 
                type="button" 
                className="admin-skills-btn-secondary" 
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="admin-skills-btn-primary"
                disabled={isCreatingSkill}
              >
                {isCreatingSkill ? 'Saving...' : 'Assign'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Global Rename/Edit Modal */}
      {editingSkillGroup && (
        <div className="admin-skills-modal-overlay">
          <form className="admin-skills-modal admin-glow-card" onSubmit={handleSaveGlobalEdit}>
            <div className="admin-skills-modal__header">
              <h3 className="admin-skills-modal__title">Rename Skill Globally</h3>
              <button 
                type="button" 
                onClick={() => setEditingSkillGroup(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--admin-text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="admin-skills-modal__content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '0.85rem', borderRadius: '8px', marginBottom: '0.5rem' }}>
                <AlertTriangle size={18} style={{ color: 'var(--admin-status-warning)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-primary)', lineHeight: 1.4 }}>
                  This updates this skill for <strong>{editingSkillGroup.total_users}</strong> users globally.
                </span>
              </div>

              <div className="admin-skills-form-group">
                <label className="admin-skills-form-label">New Skill Name</label>
                <input 
                  type="text" 
                  className="admin-skills-form-input"
                  required
                  value={editGroupForm.new_name}
                  onChange={(e) => setEditGroupForm(prev => ({ ...prev, new_name: e.target.value }))}
                />
              </div>

              <div className="admin-skills-form-group">
                <label className="admin-skills-form-label">Recolor Swatch</label>
                <div className="admin-skills-color-picker-row">
                  {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map(c => (
                    <div 
                      key={c}
                      className={`admin-skills-color-swatch ${editGroupForm.color === c ? 'selected' : ''}`}
                      style={{ backgroundColor: c, color: c }}
                      onClick={() => setEditGroupForm(prev => ({ ...prev, color: c }))}
                    >
                      {editGroupForm.color === c && <Check size={12} style={{ color: '#fff' }} />}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="admin-skills-modal__footer">
              <button 
                type="button" 
                className="admin-skills-btn-secondary" 
                onClick={() => setEditingSkillGroup(null)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="admin-skills-btn-primary"
                disabled={isSavingGlobalEdit}
              >
                {isSavingGlobalEdit ? 'Saving...' : 'Rename Group'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Global Delete Confirmation Modal */}
      {deleteConfirmGroup && (
        <div className="admin-skills-modal-overlay">
          <div className="admin-skills-modal admin-glow-card">
            <div className="admin-skills-modal__header">
              <h3 className="admin-skills-modal__title">Delete Skill Group</h3>
              <button 
                onClick={() => setDeleteConfirmGroup(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--admin-text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="admin-skills-modal__content">
              <p style={{ fontSize: '0.875rem', color: 'var(--admin-text-primary)', margin: 0, lineHeight: 1.5 }}>
                Delete <strong>{deleteConfirmGroup.name}</strong> from all <strong>{deleteConfirmGroup.total_users}</strong> users?
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)', margin: '0.5rem 0 0 0', lineHeight: 1.4 }}>
                This is a global action. All tasks associated with this skill name across all learners will be permanently removed.
              </p>
            </div>

            <div className="admin-skills-modal__footer">
              <button 
                className="admin-skills-btn-secondary" 
                onClick={() => setDeleteConfirmGroup(null)}
              >
                Cancel
              </button>
              <button 
                className="admin-skills-btn-primary"
                style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
                disabled={isDeletingGlobal}
                onClick={handleDeleteGlobalGroup}
              >
                {isDeletingGlobal ? 'Deleting...' : 'Delete Globally'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Edit User Skill targets modal */}
      {editingUserSkill && (
        <div className="admin-skills-modal-overlay">
          <div className="admin-skills-modal admin-glow-card">
            <div className="admin-skills-modal__header">
              <h3 className="admin-skills-modal__title">Edit Learner Target</h3>
              <button onClick={() => setEditingUserSkill(null)} style={{ background: 'transparent', border: 'none', color: 'var(--admin-text-secondary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            
            <div className="admin-skills-modal__content">
              <div className="admin-skills-form-group">
                <label className="admin-skills-form-label">Learner Name</label>
                <input 
                  type="text" 
                  className="admin-skills-form-input" 
                  disabled 
                  value={editingUserSkill.full_name || editingUserSkill.username} 
                />
              </div>

              <div className="admin-skills-form-group">
                <label className="admin-skills-form-label">Target Tasks</label>
                <input 
                  type="number" 
                  className="admin-skills-form-input"
                  min="1"
                  value={userSkillForm.target_tasks}
                  onChange={(e) => setUserSkillForm(prev => ({ ...prev, target_tasks: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>

            <div className="admin-skills-modal__footer">
              <button className="admin-skills-btn-secondary" onClick={() => setEditingUserSkill(null)}>
                Cancel
              </button>
              <button 
                className="admin-skills-btn-primary" 
                onClick={handleSaveUserSkill}
                disabled={isSavingUserSkill}
              >
                {isSavingUserSkill ? 'Saving...' : 'Save Target'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
