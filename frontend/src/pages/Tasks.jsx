import React, { useState, useEffect, useCallback, useMemo } from 'react'
import tasksService from '../services/tasksService'
import skillsService from '../services/skillsService'
import { TaskCard, TaskModal, TaskHistoryModal, DeleteConfirmModal } from '../components/tasks'
import { Plus, Search, AlertCircle, ClipboardList, SlidersHorizontal } from 'lucide-react'

/* ─── Skeleton Card ─────────────────────────────────────────────────── */
function TaskCardSkeleton() {
  return (
    <div className="tc-skeleton">
      <div className="tc-skeleton__check" />
      <div className="tc-skeleton__body">
        <div className="tc-skeleton__line tc-skeleton__line--title" />
        <div className="tc-skeleton__line tc-skeleton__line--desc" />
        <div className="tc-skeleton__footer">
          <div className="tc-skeleton__pill" />
          <div className="tc-skeleton__pill tc-skeleton__pill--sm" />
        </div>
      </div>
    </div>
  )
}

/* ─── Error Banner ──────────────────────────────────────────────────── */
function ErrorBanner({ message, onRetry }) {
  return (
    <div className="dash-error" role="alert">
      <div className="dash-error__inner">
        <AlertCircle size={20} className="dash-error__icon text-red-400" />
        <div>
          <p className="dash-error__title">Failed to load tasks</p>
          <p className="dash-error__msg">{message}</p>
        </div>
      </div>
      <button id="tasks-retry-btn" className="dash-error__retry cursor-pointer" onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}

/* ─── Status Tab Button ─────────────────────────────────────────────── */
function StatusTab({ label, value, active, onClick }) {
  return (
    <button
      onClick={() => onClick(value)}
      className={`tc-tab ${active ? 'tc-tab--active' : 'tc-tab--inactive'}`}
      aria-current={active ? 'page' : undefined}
    >
      {label}
    </button>
  )
}

/* ─── Empty State ───────────────────────────────────────────────────── */
function EmptyState({ hasFilter, onCreateTask }) {
  return (
    <div className="tc-empty">
      <div className="tc-empty__icon">
        <ClipboardList size={32} strokeWidth={1.5} />
      </div>
      {hasFilter ? (
        <>
          <h3 className="tc-empty__title">No matching tasks</h3>
          <p className="tc-empty__desc">
            No tasks match your current filters. Try clearing your search or selecting "All Skills".
          </p>
        </>
      ) : (
        <>
          <h3 className="tc-empty__title">No tasks yet</h3>
          <p className="tc-empty__desc">
            Organize your progress goals by creating tasks and linking them to your skills.
          </p>
          <button onClick={onCreateTask} className="tc-empty__cta">
            <Plus size={16} strokeWidth={2.5} />
            Create your first task
          </button>
        </>
      )}
    </div>
  )
}

/* ─── Tasks Page ────────────────────────────────────────────────────── */
/**
 * Tasks — V3 Premium Redesign
 *
 * Page controller representing the Tasks management interface.
 * Implements CRUD actions, Complete/Reopen toggles, History logs modal,
 * and multi-filtering (Skill filter, Status tabs, search).
 *
 * All business logic is preserved exactly as-is.
 * Only the UI/layout has been updated.
 */
export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [skills, setSkills] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSkillFilter, setSelectedSkillFilter] = useState('all')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all')

  // Modals Control
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [selectedEditTask, setSelectedEditTask] = useState(null)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedDeleteTask, setSelectedDeleteTask] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [selectedHistoryTask, setSelectedHistoryTask] = useState(null)

  // Fetch Tasks and Skills Concurrently
  const fetchTasksAndSkills = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    setError(null)
    try {
      const [tasksData, skillsData] = await Promise.all([
        tasksService.getAll(),
        skillsService.getAll(),
      ])
      setTasks(tasksData || [])
      setSkills(skillsData || [])
    } catch (err) {
      const msg =
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        err?.message ??
        'Failed to load tasks. Please ensure the backend server is running.'
      setError(msg)
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }, [])

  // Fire on mount
  useEffect(() => {
    fetchTasksAndSkills()
  }, [fetchTasksAndSkills])

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setSelectedEditTask(null)
    setIsFormModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEditModal = (task) => {
    setSelectedEditTask(task)
    setIsFormModalOpen(true)
  }

  // Open Delete Modal
  const handleOpenDeleteModal = (task) => {
    setSelectedDeleteTask(task)
    setIsDeleteModalOpen(true)
  }

  // Open History Modal
  const handleOpenHistoryModal = (task) => {
    setSelectedHistoryTask(task)
    setIsHistoryModalOpen(true)
  }

  // Handle Complete / Reopen Status Toggle
  const handleToggleStatus = async (task) => {
    try {
      if (task.status === 'completed') {
        await tasksService.reopen(task.id)
      } else {
        await tasksService.complete(task.id)
      }
      // Silent refresh for smooth transition, updates progress counts in backend
      await fetchTasksAndSkills(false)
    } catch (err) {
      alert(
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        err?.message ??
        'Failed to update task status.'
      )
    }
  }

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!selectedDeleteTask) return
    setIsDeleting(true)
    try {
      await tasksService.remove(selectedDeleteTask.id)
      setTasks((prev) => prev.filter((t) => t.id !== selectedDeleteTask.id))
      setIsDeleteModalOpen(false)
      setSelectedDeleteTask(null)
    } catch (err) {
      alert(
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        err?.message ??
        'Failed to delete task.'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  // Client-Side Task Filter Resolution
  const filteredTasks = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return tasks.filter((task) => {
      // 1. Text Search Filter (Title & Description)
      const matchesSearch =
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query))

      // 2. Associated Skill Filter
      const matchesSkill = selectedSkillFilter === 'all' || task.skill.toString() === selectedSkillFilter

      // 3. Status Filter
      const matchesStatus = selectedStatusFilter === 'all' || task.status === selectedStatusFilter

      return matchesSearch && matchesSkill && matchesStatus
    })
  }, [tasks, searchQuery, selectedSkillFilter, selectedStatusFilter])

  const STATUS_TABS = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Completed', value: 'completed' },
  ]

  return (
    <div id="page-tasks" className="tc-page animate-fade-in">

      {/* ══ Page Header ══════════════════════════════════════════════ */}
      <div className="tc-header">
        <div className="tc-header__text">
          <h1 className="tc-header__title">Tasks &amp; Milestones</h1>
          <p className="tc-header__sub">
            Define objectives, assign them to key skills, and log completions.
          </p>
        </div>

        {/* Desktop Add Task button */}
        <button
          id="tasks-add-btn-header"
          onClick={handleOpenCreateModal}
          className="tc-add-btn tc-add-btn--desktop"
          aria-label="Add new task"
        >
          <Plus size={18} strokeWidth={2.5} />
          Add Task
        </button>
      </div>

      {/* ══ Error Banner ══════════════════════════════════════════════ */}
      {error && <ErrorBanner message={error} onRetry={() => fetchTasksAndSkills(true)} />}

      {/* ══ Filter Bar ════════════════════════════════════════════════ */}
      {!error && (
        <div className="tc-filterbar">

          {/* ── Top Row: Search + Skill Dropdown ── */}
          <div className="tc-filterbar__top">
            {/* Search Input */}
            <div className="tc-search">
              <Search size={16} strokeWidth={2} className="tc-search__icon" />
              <input
                id="tasks-search"
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="tc-search__input"
                aria-label="Search tasks"
              />
            </div>

            {/* Skill Filter Dropdown */}
            <div className="tc-skill-filter">
              <SlidersHorizontal size={14} className="tc-skill-filter__icon" />
              <select
                id="skill-filter"
                value={selectedSkillFilter}
                onChange={(e) => setSelectedSkillFilter(e.target.value)}
                className="tc-skill-filter__select"
                aria-label="Filter by skill"
              >
                <option value="all" className="bg-[#111827]">All Skills</option>
                {skills.map((skill) => (
                  <option key={skill.id} value={skill.id} className="bg-[#111827]">
                    {skill.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Status Tabs ── */}
          <div className="tc-tabs" role="tablist" aria-label="Filter tasks by status">
            {STATUS_TABS.map(({ label, value }) => (
              <StatusTab
                key={value}
                label={label}
                value={value}
                active={selectedStatusFilter === value}
                onClick={setSelectedStatusFilter}
              />
            ))}
          </div>
        </div>
      )}

      {/* ══ Tasks Grid ════════════════════════════════════════════════ */}
      {isLoading ? (
        <div className="tc-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => <TaskCardSkeleton key={i} />)}
        </div>
      ) : tasks.length === 0 && !error ? (
        <EmptyState hasFilter={false} onCreateTask={handleOpenCreateModal} />
      ) : filteredTasks.length === 0 && !error ? (
        <EmptyState hasFilter={true} onCreateTask={handleOpenCreateModal} />
      ) : (
        <div className="tc-grid">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              skills={skills}
              onEdit={handleOpenEditModal}
              onDelete={handleOpenDeleteModal}
              onToggleStatus={handleToggleStatus}
              onViewHistory={handleOpenHistoryModal}
            />
          ))}
        </div>
      )}

      {/* ══ Mobile Floating Add Button ════════════════════════════════ */}
      <button
        id="tasks-fab"
        onClick={handleOpenCreateModal}
        className="tc-fab"
        aria-label="Add new task"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      {/* ══ Modals ════════════════════════════════════════════════════ */}

      {/* Create / Edit Form Modal */}
      <TaskModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSaveSuccess={() => fetchTasksAndSkills(false)}
        editTask={selectedEditTask}
        skills={skills}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        taskTitle={selectedDeleteTask?.title || ''}
        isDeleting={isDeleting}
      />

      {/* View Task Completions History Modal */}
      <TaskHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        task={selectedHistoryTask}
      />
    </div>
  )
}
