import React, { useState, useEffect, useCallback } from 'react'
import { 
  ClipboardList, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  Calendar, 
  User as UserIcon, 
  Brain,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { adminTasksService } from '../services/tasksService'
import './Tasks.css'

export default function Tasks() {
  // Data state
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState({
    total_tasks: 0,
    completed_tasks: 0,
    pending_tasks: 0
  })

  // Loading, paging, errors
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [statusParam, setStatusParam] = useState('all')
  const [priority, setPriority] = useState('all')
  const [sort, setSort] = useState('newest')

  // Edit Modal State
  const [editingTask, setEditingTask] = useState(null)
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium'
  })
  const [isSavingTask, setIsSavingTask] = useState(false)

  // Delete Confirmation Modal State
  const [deleteConfirmTask, setDeleteConfirmTask] = useState(null)
  const [isDeletingTask, setIsDeletingTask] = useState(false)

  // Fetch list
  const fetchTasksList = useCallback(async (pageNum = 1, isInitial = false) => {
    if (isInitial) setIsLoading(true)
    setError(null)

    try {
      const params = {
        page: pageNum,
        limit: 10,
        search: search.trim(),
        status: statusParam !== 'all' ? statusParam : undefined,
        priority: priority !== 'all' ? priority : undefined,
        sort
      }
      const data = await adminTasksService.getTasksList(params)
      setTasks(data.tasks || [])
      if (data.stats) {
        setStats(data.stats)
      }
      setTotalPages(data.total_pages || 1)
      setTotalCount(data.total_count || 0)
      setPage(data.current_page || pageNum)
    } catch (err) {
      console.error('Error fetching tasks list:', err)
      setError('Failed to fetch tasks list.')
    } finally {
      setIsLoading(false)
    }
  }, [search, statusParam, priority, sort])

  // Trigger fetch when search or filters change
  useEffect(() => {
    fetchTasksList(1, true)
  }, [search, statusParam, priority, sort, fetchTasksList])

  // Pagination page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return
    fetchTasksList(newPage, false)
  }

  // Open Edit Modal
  const openEditModal = (task) => {
    setEditingTask(task)
    setTaskForm({
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'pending',
      priority: task.priority || 'medium'
    })
  }

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!taskForm.title.trim() || isSavingTask) return
    setIsSavingTask(true)

    try {
      await adminTasksService.updateTask(editingTask.id, {
        title: taskForm.title.trim(),
        description: taskForm.description,
        status: taskForm.status,
        priority: taskForm.priority
      })
      setEditingTask(null)
      fetchTasksList(page, false)
    } catch (err) {
      console.error('Error updating task:', err)
      alert(err.response?.data?.detail || 'Failed to update task.')
    } finally {
      setIsSavingTask(false)
    }
  }

  // Toggle status inline
  const handleToggleStatus = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    try {
      await adminTasksService.updateTask(task.id, {
        status: newStatus
      })
      fetchTasksList(page, false)
    } catch (err) {
      console.error('Error toggling task status:', err)
      alert('Failed to toggle status.')
    }
  }

  // Open Delete Confirm
  const openDeleteConfirm = (task) => {
    setDeleteConfirmTask(task)
  }

  // Handle Delete Submit
  const handleDeleteSubmit = async () => {
    if (isDeletingTask) return
    setIsDeletingTask(true)

    try {
      await adminTasksService.deleteTask(deleteConfirmTask.id)
      setDeleteConfirmTask(null)
      fetchTasksList(page, false)
    } catch (err) {
      console.error('Error deleting task:', err)
      alert(err.response?.data?.detail || 'Failed to delete task.')
    } finally {
      setIsDeletingTask(false)
    }
  }

  return (
    <div className="admin-tasks-container">
      {/* Header section */}
      <div className="admin-tasks-header">
        <div className="header-left">
          <div className="header-icon-wrapper">
            <ClipboardList className="header-icon" />
          </div>
          <div>
            <h1 className="admin-tasks-title">Tasks Management</h1>
            <p className="admin-tasks-subtitle">Monitor and update user training tasks and progress</p>
          </div>
        </div>
      </div>

      {/* Stats panel */}
      <div className="admin-tasks-stats-grid">
        <div className="admin-tasks-stat-card admin-glow-card">
          <div className="stat-icon-wrapper purple">
            <ClipboardList className="stat-icon" />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Tasks</span>
            <span className="stat-value">{stats.total_tasks}</span>
          </div>
        </div>

        <div className="admin-tasks-stat-card admin-glow-card">
          <div className="stat-icon-wrapper green">
            <CheckCircle2 className="stat-icon" />
          </div>
          <div className="stat-content">
            <span className="stat-label">Completed Tasks</span>
            <span className="stat-value text-success">{stats.completed_tasks}</span>
          </div>
        </div>

        <div className="admin-tasks-stat-card admin-glow-card">
          <div className="stat-icon-wrapper amber">
            <Clock className="stat-icon" />
          </div>
          <div className="stat-content">
            <span className="stat-label">Pending Tasks</span>
            <span className="stat-value text-warning">{stats.pending_tasks}</span>
          </div>
        </div>
      </div>

      {/* Filter and controls bar */}
      <div className="admin-tasks-filter-bar admin-glow-card">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search by title, owner, or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filters-group">
          <div className="filter-item">
            <Filter className="filter-icon" />
            <select value={statusParam} onChange={(e) => setStatusParam(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="filter-item">
            <AlertTriangle className="filter-icon" />
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="filter-item">
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      {error && (
        <div className="admin-tasks-error-alert">
          <AlertCircle className="error-alert-icon" />
          <span>{error}</span>
        </div>
      )}

      <div className="admin-tasks-table-wrapper admin-glow-card">
        {isLoading ? (
          <div className="admin-tasks-loading">
            <div className="spinner"></div>
            <p>Loading tasks catalog...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="admin-tasks-empty-state">
            <ClipboardList className="empty-icon" />
            <h3>No Tasks Found</h3>
            <p>Try broadening your keywords or resetting filters.</p>
          </div>
        ) : (
          <>
            <table className="admin-tasks-table">
              <thead>
                <tr>
                  <th>Task Info</th>
                  <th>Owner</th>
                  <th>Skill Group</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="actions-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <div className="task-title-cell">
                        <span className="task-title-text" title={task.title}>{task.title}</span>
                        {task.description && (
                          <span className="task-desc-text" title={task.description}>
                            {task.description.length > 60 ? `${task.description.substring(0, 60)}...` : task.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="user-owner-cell">
                        <UserIcon className="owner-icon" />
                        <div>
                          <div className="owner-name">{task.owner?.full_name || task.owner?.username}</div>
                          <div className="owner-email">{task.owner?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {task.skill ? (
                        <span 
                          className="skill-tag" 
                          style={{ 
                            backgroundColor: `${task.skill.color}15`, 
                            borderColor: task.skill.color,
                            color: task.skill.color 
                          }}
                        >
                          <Brain className="tag-icon" />
                          {task.skill.name}
                        </span>
                      ) : (
                        <span className="skill-tag-none">No Skill</span>
                      )}
                    </td>
                    <td>
                      <span className={`priority-badge ${task.priority || 'medium'}`}>
                        {task.priority || 'medium'}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleToggleStatus(task)}
                        className={`status-toggle-btn ${task.status === 'completed' ? 'completed' : 'pending'}`}
                        title="Click to toggle status"
                      >
                        {task.status === 'completed' ? (
                          <>
                            <Check className="toggle-icon" />
                            Completed
                          </>
                        ) : (
                          <>
                            <span className="toggle-dot" />
                            Pending
                          </>
                        )}
                      </button>
                    </td>
                    <td>
                      <div className="date-cell">
                        <Calendar className="date-icon" />
                        <span>{new Date(task.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button 
                          onClick={() => openEditModal(task)} 
                          className="action-btn edit" 
                          title="Edit Task"
                        >
                          <Edit2 className="action-icon" />
                        </button>
                        <button 
                          onClick={() => openDeleteConfirm(task)} 
                          className="action-btn delete" 
                          title="Delete Task"
                        >
                          <Trash2 className="action-icon" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="admin-tasks-pagination">
                <span className="pagination-info">
                  Showing <strong>{tasks.length}</strong> of <strong>{totalCount}</strong> tasks
                </span>
                <div className="pagination-buttons">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="pagination-btn"
                  >
                    <ChevronLeft className="page-icon" />
                    Previous
                  </button>
                  <span className="page-indicator">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="pagination-btn"
                  >
                    Next
                    <ChevronRight className="page-icon" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="admin-tasks-modal-overlay">
          <div className="admin-tasks-modal admin-glow-card">
            <div className="modal-header">
              <h3>Edit Task Details</h3>
              <button onClick={() => setEditingTask(null)} className="close-btn">
                <X />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="modal-form">
              <div className="form-group">
                <label>Task Title</label>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={3}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTask}
                  className="save-btn"
                >
                  {isSavingTask ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmTask && (
        <div className="admin-tasks-modal-overlay">
          <div className="admin-tasks-modal confirm-delete admin-glow-card">
            <div className="modal-header">
              <h3>Confirm Task Deletion</h3>
              <button onClick={() => setDeleteConfirmTask(null)} className="close-btn">
                <X />
              </button>
            </div>
            <div className="modal-body">
              <div className="alert-icon-container">
                <AlertTriangle className="alert-warning-icon" />
              </div>
              <p>
                Are you sure you want to permanently delete the task <strong>"{deleteConfirmTask.title}"</strong>?
              </p>
              <p className="danger-notice">
                This action is irreversible and will remove this task from the learner's workspace.
              </p>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setDeleteConfirmTask(null)}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubmit}
                disabled={isDeletingTask}
                className="delete-btn"
              >
                {isDeletingTask ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
