import React, { useState, useEffect, useCallback } from 'react'
import { 
  Trophy, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  HelpCircle,
  AlertCircle,
  Eye,
  AlertTriangle,
  Award,
  BookOpen
} from 'lucide-react'
import { adminAchievementsService } from '../services/achievementsService'
import './Achievements.css'

export default function Achievements() {
  // Data state
  const [achievements, setAchievements] = useState([])
  const [stats, setStats] = useState({
    total_achievements: 0,
    total_unlocked: 0
  })

  // Loading & errors
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Add Achievement Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({
    name: '',
    description: '',
    icon: '🏆',
    condition: ''
  })
  const [isCreating, setIsCreating] = useState(false)

  // Edit Modal State
  const [editingAchievement, setEditingAchievement] = useState(null)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    icon: '🏆',
    condition: '',
    is_active: true
  })
  const [isSaving, setIsSaving] = useState(false)

  // Delete Confirm Modal State
  const [deleteConfirmAchievement, setDeleteConfirmAchievement] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch list & stats
  const fetchAchievements = useCallback(async (isInitial = true) => {
    if (isInitial) setIsLoading(true)
    setError(null)
    try {
      const data = await adminAchievementsService.getAchievementsList()
      setAchievements(data.achievements || [])
      if (data.stats) {
        setStats(data.stats)
      }
    } catch (err) {
      console.error('Error fetching achievements:', err)
      setError('Failed to load achievements listing.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAchievements(true)
  }, [fetchAchievements])

  // Handle Add
  const handleAddSubmit = async (e) => {
    e.preventDefault()
    if (!addForm.name.trim() || !addForm.description.trim() || !addForm.condition.trim() || isCreating) return
    setIsCreating(true)

    try {
      await adminAchievementsService.createAchievement({
        name: addForm.name.trim(),
        description: addForm.description.trim(),
        icon: addForm.icon.trim(),
        condition: addForm.condition.trim()
      })
      setShowAddModal(false)
      setAddForm({
        name: '',
        description: '',
        icon: '🏆',
        condition: ''
      })
      fetchAchievements(false)
    } catch (err) {
      console.error('Error creating achievement:', err)
      alert(err.response?.data?.detail || 'Failed to create achievement.')
    } finally {
      setIsCreating(false)
    }
  }

  // Open Edit Modal
  const openEditModal = (ach) => {
    setEditingAchievement(ach)
    setEditForm({
      name: ach.name || '',
      description: ach.description || '',
      icon: ach.icon || '🏆',
      condition: ach.condition || '',
      is_active: ach.is_active !== undefined ? ach.is_active : true
    })
  }

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editForm.name.trim() || !editForm.description.trim() || !editForm.condition.trim() || isSaving) return
    setIsSaving(true)

    try {
      await adminAchievementsService.updateAchievement(editingAchievement.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        icon: editForm.icon.trim(),
        condition: editForm.condition.trim(),
        is_active: editForm.is_active
      })
      setEditingAchievement(null)
      fetchAchievements(false)
    } catch (err) {
      console.error('Error updating achievement:', err)
      alert(err.response?.data?.detail || 'Failed to update achievement.')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Delete Confirm
  const handleDeleteSubmit = async () => {
    if (isDeleting) return
    setIsDeleting(true)

    try {
      const res = await adminAchievementsService.deleteAchievement(deleteConfirmAchievement.id)
      setDeleteConfirmAchievement(null)
      alert(res.detail || 'Achievement action processed.')
      fetchAchievements(false)
    } catch (err) {
      console.error('Error deleting achievement:', err)
      alert(err.response?.data?.detail || 'Failed to delete achievement.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="admin-achievements-container">
      {/* Header section */}
      <div className="admin-achievements-header">
        <div className="header-left">
          <div className="header-icon-wrapper">
            <Trophy className="header-icon" />
          </div>
          <div>
            <h1 className="admin-achievements-title">Achievements Registry</h1>
            <p className="admin-achievements-subtitle">Manage learning achievements, milestones, and unlock triggers</p>
          </div>
        </div>
        <button className="create-achievement-btn" onClick={() => setShowAddModal(true)}>
          <Plus className="btn-icon" />
          Create Achievement
        </button>
      </div>

      {/* Stats Panel */}
      <div className="admin-achievements-stats-grid">
        <div className="admin-achievements-stat-card admin-glow-card">
          <div className="stat-icon-wrapper purple">
            <Trophy className="stat-icon" />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Badges</span>
            <span className="stat-value">{stats.total_achievements}</span>
          </div>
        </div>

        <div className="admin-achievements-stat-card admin-glow-card">
          <div className="stat-icon-wrapper green">
            <Award className="stat-icon" />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Times Unlocked</span>
            <span className="stat-value text-success">{stats.total_unlocked}</span>
          </div>
        </div>
      </div>

      {/* Main Grid List */}
      {error && (
        <div className="admin-achievements-error-alert">
          <AlertCircle className="error-alert-icon" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="admin-achievements-loading">
          <div className="spinner"></div>
          <p>Loading achievements...</p>
        </div>
      ) : achievements.length === 0 ? (
        <div className="admin-achievements-empty-state admin-glow-card">
          <Trophy className="empty-icon" />
          <h3>No Achievements Registered</h3>
          <p>Create your first system achievement milestone to get started.</p>
        </div>
      ) : (
        <div className="admin-achievements-grid">
          {achievements.map((ach) => (
            <div 
              key={ach.id} 
              className={`achievement-card admin-glow-card ${!ach.is_active ? 'soft-disabled' : ''}`}
            >
              {!ach.is_active && (
                <div className="soft-disabled-tag">
                  Disabled
                </div>
              )}
              <div className="card-top">
                <span className="achievement-emoji" role="img" aria-label="achievement icon">
                  {ach.icon || '🏆'}
                </span>
                <div className="card-actions">
                  <button 
                    onClick={() => openEditModal(ach)} 
                    className="action-btn edit" 
                    title="Edit Achievement"
                  >
                    <Edit2 className="action-icon" />
                  </button>
                  <button 
                    onClick={() => setDeleteConfirmAchievement(ach)} 
                    className="action-btn delete" 
                    title="Delete / Disable Achievement"
                  >
                    <Trash2 className="action-icon" />
                  </button>
                </div>
              </div>

              <div className="card-body">
                <h3 className="achievement-card-title">{ach.name}</h3>
                <p className="achievement-card-desc">{ach.description}</p>
                
                <div className="achievement-condition-box">
                  <span className="condition-label">Unlock Rule Condition:</span>
                  <code className="condition-code">{ach.condition}</code>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Achievement Modal */}
      {showAddModal && (
        <div className="admin-achievements-modal-overlay">
          <div className="admin-achievements-modal admin-glow-card">
            <div className="modal-header">
              <h3>Create New Achievement</h3>
              <button onClick={() => setShowAddModal(false)} className="close-btn">
                <X />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="modal-form">
              <div className="form-row select-emoji-row">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Speed Demon"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group emoji-group">
                  <label>Icon Emoji</label>
                  <input
                    type="text"
                    required
                    placeholder="🏆"
                    value={addForm.icon}
                    onChange={(e) => setAddForm({ ...addForm, icon: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Describe how user unlocks this milestone..."
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>System Condition Rule Identifier</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. speed_demon, completed_tasks >= 5"
                  value={addForm.condition}
                  onChange={(e) => setAddForm({ ...addForm, condition: e.target.value })}
                />
                <span className="help-text">Condition ID used by the system triggers engine</span>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="save-btn"
                >
                  {isCreating ? 'Creating...' : 'Create Badge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Achievement Modal */}
      {editingAchievement && (
        <div className="admin-achievements-modal-overlay">
          <div className="admin-achievements-modal admin-glow-card">
            <div className="modal-header">
              <h3>Edit Achievement</h3>
              <button onClick={() => setEditingAchievement(null)} className="close-btn">
                <X />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="modal-form">
              <div className="form-row select-emoji-row">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group emoji-group">
                  <label>Icon Emoji</label>
                  <input
                    type="text"
                    required
                    value={editForm.icon}
                    onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={2}
                  required
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>System Condition Rule Identifier</label>
                <input
                  type="text"
                  required
                  value={editForm.condition}
                  onChange={(e) => setEditForm({ ...editForm, condition: e.target.value })}
                />
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  />
                  <span>Active & Grantable</span>
                </label>
                <span className="help-text">If disabled, this badge cannot be newly earned by users.</span>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setEditingAchievement(null)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="save-btn"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Disable Confirmation Modal */}
      {deleteConfirmAchievement && (
        <div className="admin-achievements-modal-overlay">
          <div className="admin-achievements-modal confirm-delete admin-glow-card">
            <div className="modal-header">
              <h3>Remove / Soft-Disable Achievement</h3>
              <button onClick={() => setDeleteConfirmAchievement(null)} className="close-btn">
                <X />
              </button>
            </div>
            <div className="modal-body">
              <div className="alert-icon-container">
                <AlertTriangle className="alert-warning-icon" />
              </div>
              <p>
                Are you sure you want to remove <strong>"{deleteConfirmAchievement.name}"</strong>?
              </p>
              <p className="danger-notice">
                If the achievement has unlocking history, it will be automatically <strong>soft-disabled</strong> (is_active marked false) to protect user records. Otherwise, it will be permanently deleted.
              </p>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setDeleteConfirmAchievement(null)}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubmit}
                disabled={isDeleting}
                className="delete-btn"
              >
                {isDeleting ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
