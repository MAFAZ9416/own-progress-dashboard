import React, { useState, useEffect, useCallback } from 'react'
import { ShieldCheck, User, Mail, ShieldAlert, Key, Edit, RefreshCw, AlertCircle, CheckCircle2, MoreVertical } from 'lucide-react'
import { adminRolesService } from '../services/rolesService'
import { useAuth } from '../../contexts/AuthContext'
import './Roles.css'

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner (Super Admin)' },
  { value: 'admin', label: 'Admin (Staff)' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'viewer', label: 'Viewer (Read-only)' },
]

export default function Roles() {
  const { user: currentUser } = useAuth()
  const [admins, setAdmins] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Edit action state
  const [updatingId, setUpdatingId] = useState(null)
  const [editingUser, setEditingUser] = useState(null) // target user object being edited
  const [editForm, setEditForm] = useState({ role: '', is_active: true })
  const [toast, setToast] = useState(null)

  const fetchRolesList = useCallback(async (isInitial = true) => {
    if (isInitial) setIsLoading(true)
    setError(null)
    try {
      const data = await adminRolesService.getRoles()
      setAdmins(data.roles || [])
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to fetch admin users registry.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRolesList(true)
  }, [fetchRolesList])

  const triggerToast = (type, msg) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 5000)
  }

  // Handle patch role
  const handleUpdateRole = async (e) => {
    e.preventDefault()
    if (!editingUser || updatingId) return
    setUpdatingId(editingUser.id)

    // Frontend Owner protection validation check
    if (editingUser.is_superuser && editingUser.id !== currentUser?.id) {
      triggerToast('error', 'Security Policy Error: Another owner account cannot be modified.')
      setUpdatingId(null)
      setEditingUser(null)
      return
    }

    try {
      const result = await adminRolesService.updateRole(editingUser.id, {
        role: editForm.role,
        is_active: editForm.is_active,
      })
      triggerToast('success', result.detail || `Role updated for ${editingUser.username}.`)
      setEditingUser(null)
      fetchRolesList(false)
    } catch (err) {
      triggerToast('error', err.response?.data?.detail || err.message || 'Failed to update administrative permissions.')
    } finally {
      setUpdatingId(null)
    }
  }

  const startEditing = (admin) => {
    // Prevent editing another owner
    if (admin.is_superuser && admin.id !== currentUser?.id) {
      triggerToast('error', 'Access Denied: Owner accounts cannot be modified by other admins.')
      return
    }
    setEditingUser(admin)
    setEditForm({
      role: admin.role?.toLowerCase() || 'user',
      is_active: admin.is_active,
    })
  }

  return (
    <div className="roles-page">
      {/* Header */}
      <div className="roles-header">
        <div className="roles-header__left">
          <div className="roles-header__icon">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="roles-header__title">Roles &amp; Permissions</h1>
            <p className="roles-header__sub">Audit administrator groups, system roles, and account levels</p>
          </div>
        </div>
        <button
          className="roles-refresh-btn"
          onClick={() => fetchRolesList(true)}
          disabled={isLoading}
          id="roles-refresh-btn"
        >
          <RefreshCw size={14} className={isLoading ? 'roles-spin' : ''} />
          Refresh Registry
        </button>
      </div>

      {toast && (
        <div className={`roles-toast roles-toast--${toast.type} animate-slide-down`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toast.msg}</span>
        </div>
      )}

      {error && (
        <div className="roles-error-alert animate-slide-down">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Main card */}
      <div className="roles-card admin-glow-card">
        <div className="roles-card__header">
          <ShieldAlert size={18} className="icon-purple" />
          <h3>Administrative Accounts Directory</h3>
          <span className="roles-count-badge">{admins.length} Staff members</span>
        </div>

        <div className="roles-card__body">
          {isLoading && admins.length === 0 ? (
            <div className="roles-loading">
              <div className="spinner"></div>
              <p>Fetching active administrators registry...</p>
            </div>
          ) : (
            <div className="roles-table-wrap">
              {/* Responsive layout: Table on desktop, Cards on mobile */}
              <table className="roles-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role Level</th>
                    <th>Groups</th>
                    <th>Permissions</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Last Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => {
                    const isOwner = admin.is_superuser || admin.role?.toLowerCase() === 'owner'
                    return (
                      <tr key={admin.id} className={`roles-tr${isOwner ? ' roles-tr--protected' : ''}`}>
                        <td className="roles-td-user">
                          <div className="user-avatar-wrap">
                            {admin.avatar ? (
                              <img src={admin.avatar} alt="avatar" />
                            ) : (
                              <User size={14} />
                            )}
                          </div>
                          <div>
                            <div className="user-name">{admin.full_name || admin.username}</div>
                            <div className="user-username">@{admin.username}</div>
                          </div>
                        </td>
                        <td className="roles-td-email">
                          <Mail size={12} className="inline-icon" />
                          {admin.email}
                        </td>
                        <td>
                          <span className={`role-badge role-badge--${admin.role?.toLowerCase()}`}>
                            {admin.role}
                          </span>
                        </td>
                        <td>
                          <div className="groups-list" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            {admin.groups?.join(', ') || '—'}
                          </div>
                        </td>
                        <td style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
                          {admin.permissions_count}
                        </td>
                        <td>
                          <span className={`status-pill status-${admin.is_active ? 'active' : 'inactive'}`}>
                            {admin.is_active ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td className="roles-td-date">{admin.joined_date}</td>
                        <td className="roles-td-date">{admin.last_login}</td>
                        <td>
                          {isOwner ? (
                            <span className="protected-indicator" title="Protected Owner Account">
                              <Key size={12} />
                              Protected
                            </span>
                          ) : (
                            <button
                              className="roles-edit-btn"
                              onClick={() => startEditing(admin)}
                              id={`edit-role-${admin.id}`}
                            >
                              <Edit size={12} />
                              Edit Level
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Mobile View - Cards */}
              <div className="roles-cards-mobile">
                {admins.map((admin) => {
                  const isOwner = admin.is_superuser || admin.role?.toLowerCase() === 'owner'
                  return (
                    <div key={admin.id} className={`roles-mobile-card${isOwner ? ' roles-mobile-card--protected' : ''}`}>
                      <div className="mobile-card-row mobile-card-header">
                        <div className="user-profile-summary">
                          <div className="user-avatar-wrap">
                            {admin.avatar ? <img src={admin.avatar} alt="avatar" /> : <User size={14} />}
                          </div>
                          <div>
                            <div className="user-name">{admin.full_name || admin.username}</div>
                            <div className="user-username">@{admin.username}</div>
                          </div>
                        </div>
                        <span className={`role-badge role-badge--${admin.role?.toLowerCase()}`}>
                          {admin.role}
                        </span>
                      </div>
                      <div className="mobile-card-row">
                        <span className="lbl">Email Address</span>
                        <span className="val">{admin.email}</span>
                      </div>
                      <div className="mobile-card-row">
                        <span className="lbl">Groups</span>
                        <span className="val">{admin.groups?.join(', ') || '—'}</span>
                      </div>
                      <div className="mobile-card-row">
                        <span className="lbl">Permissions</span>
                        <span className="val">{admin.permissions_count}</span>
                      </div>
                      <div className="mobile-card-row">
                        <span className="lbl">Account Status</span>
                        <span className={`status-pill status-${admin.is_active ? 'active' : 'inactive'}`}>
                          {admin.is_active ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="mobile-card-row">
                        <span className="lbl">Last Login</span>
                        <span className="val">{admin.last_login}</span>
                      </div>
                      <div className="mobile-card-actions">
                        {isOwner ? (
                          <span className="protected-indicator" style={{ width: '100%', justifyContent: 'center' }}>
                            <Key size={12} /> Protected Owner Account
                          </span>
                        ) : (
                          <button
                            className="roles-edit-btn"
                            style={{ width: '100%', justifyContent: 'center' }}
                            onClick={() => startEditing(admin)}
                            id={`edit-role-mob-${admin.id}`}
                          >
                            <Edit size={12} /> Edit Account Privileges
                          </button>
                        )}
                      </div>
                    </div>
                  )})}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="roles-modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="roles-modal admin-glow-card" onClick={e => e.stopPropagation()}>
            <div className="roles-modal__header">
              <Edit size={18} className="icon-purple" />
              <h3>Update Privileges: {editingUser.username}</h3>
            </div>
            <form onSubmit={handleUpdateRole} className="roles-modal__form">
              <div className="form-group">
                <label>Administrative Role Level</label>
                <select
                  value={editForm.role}
                  onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                  disabled={updatingId !== null}
                  className="roles-select-field"
                  id="roles-modal-select"
                >
                  {ROLE_OPTIONS.map(o => (
                    <option
                      key={o.value}
                      value={o.value}
                      disabled={o.value === 'owner' && !currentUser?.is_superuser}
                    >
                      {o.label}
                    </option>
                  ))}
                </select>
                <span className="help-text">
                  Owners possess full system administrative capabilities. Admins/Staff access metrics and feedback dashboards.
                </span>
              </div>

              <div className="form-group">
                <label>Account Enabling State</label>
                <div className="toggle-group-inline">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={editForm.is_active}
                      onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })}
                      disabled={updatingId !== null || (editingUser.id === currentUser?.id)} // Cannot disable self
                    />
                    <span>Enable staff user login permission</span>
                  </label>
                </div>
                {editingUser.id === currentUser?.id && (
                  <span className="help-text text-orange">
                    You cannot disable or demote your own active account session.
                  </span>
                )}
              </div>

              <div className="roles-modal__actions">
                <button
                  type="button"
                  className="backups-btn backups-btn--secondary"
                  onClick={() => setEditingUser(null)}
                  disabled={updatingId !== null}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="backups-btn backups-btn--primary"
                  disabled={updatingId !== null}
                  id="roles-save-btn"
                >
                  {updatingId ? 'Saving...' : 'Save Privileges'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
