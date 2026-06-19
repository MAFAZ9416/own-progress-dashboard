import React, { useState, useEffect, useCallback } from 'react'
import tasksService from '../services/tasksService'
import skillsService from '../services/skillsService'
import { TaskCard, TaskModal, TaskHistoryModal, DeleteConfirmModal } from '../components/tasks'
import { Plus, Search, Filter, AlertCircle, ClipboardList } from 'lucide-react'

/**
 * TaskCardSkeleton
 *
 * Shimmer placeholder that matches the shape of a TaskCard.
 * Rendered while fetching tasks.
 */
function TaskCardSkeleton() {
  return (
    <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-5 h-[116px] flex items-start gap-4 animate-pulse">
      <div className="w-5.5 h-5.5 bg-slate-800/60 rounded-full shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex flex-wrap gap-2">
          <div className="h-4 bg-slate-800/60 rounded-full w-16" />
          <div className="h-4 bg-slate-800/60 rounded-full w-14" />
          <div className="h-4 bg-slate-800/60 rounded-full w-24" />
        </div>
        <div className="h-5 bg-slate-800/60 rounded w-3/4 mt-1" />
        <div className="h-3.5 bg-slate-800/60 rounded w-1/2 mt-1" />
      </div>
    </div>
  )
}

/**
 * ErrorBanner
 *
 * Rendered when tasks/skills fetch request fails.
 */
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

/**
 * Tasks
 *
 * Page controller representing the Tasks management interface.
 * Implements CRUD actions, Complete/Reopen toggles, History logs modal,
 * and multi-filtering (Skill filter, Status tabs, search).
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
  const filteredTasks = tasks.filter((task) => {
    // 1. Text Search Filter (Title & Description)
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))

    // 2. Associated Skill Filter
    const matchesSkill = selectedSkillFilter === 'all' || task.skill.toString() === selectedSkillFilter

    // 3. Status Filter
    const matchesStatus = selectedStatusFilter === 'all' || task.status === selectedStatusFilter

    return matchesSearch && matchesSkill && matchesStatus
  })

  return (
    <div id="page-tasks" className="dash-page animate-fade-in">
      {/* ── Page Header ── */}
      <div className="dash-greeting">
        <div>
          <h2 className="dash-greeting__title">Tasks & Milestones</h2>
          <p className="dash-greeting__sub font-medium">
            Define objectives, assign them to key skills, and log completions.
          </p>
        </div>
        <button
          id="tasks-add-btn"
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-2"
        >
          <Plus size={16} strokeWidth={2.5} />
          Add Task
        </button>
      </div>

      {/* ── Error Banner ── */}
      {error && <ErrorBanner message={error} onRetry={() => fetchTasksAndSkills(true)} />}

      {/* ── Filter Bar ── */}
      {!error && (
        <div className="grid gap-3 w-full mb-6">
          <div className="grid gap-3 w-full items-end sm:grid-cols-[minmax(0,1fr)_minmax(140px,180px)_auto]">
            {/* Search Input */}
            <div className="relative min-w-0">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                <Search size={14} strokeWidth={2.5} />
              </span>
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-w-0 bg-slate-950/40 border border-slate-800 focus:border-indigo-500/60 rounded-2xl pl-9 pr-4 py-3 text-slate-200 text-sm focus:outline-none transition-all placeholder-slate-600 focus:ring-1 focus:ring-indigo-500/30"
              />
            </div>

            {/* Skill Selector Filter */}
            <div className="flex items-center gap-2 min-w-0">
              <label htmlFor="skill-filter" className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500 shrink-0">
                Skill
              </label>
              <select
                id="skill-filter"
                value={selectedSkillFilter}
                onChange={(e) => setSelectedSkillFilter(e.target.value)}
                className="w-full min-w-0 bg-slate-950/40 border border-slate-800 focus:border-indigo-500/60 rounded-2xl px-3 py-3 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/30 cursor-pointer"
              >
                <option value="all" className="bg-[#111827] text-slate-350 font-medium">All Skills</option>
                {skills.map((skill) => (
                  <option key={skill.id} value={skill.id} className="bg-[#111827] text-slate-200">
                    {skill.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              id="tasks-add-btn"
              onClick={handleOpenCreateModal}
              className="h-12 min-w-[112px] px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-2xl shadow-lg shadow-indigo-600/15 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus size={16} strokeWidth={2.5} />
              Add Task
            </button>
          </div>

          <div className="flex items-center justify-start gap-4 overflow-x-auto pb-1 min-w-0">
            {['all', 'pending', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatusFilter(status)}
                className={`min-w-[80px] text-sm font-semibold capitalize transition-all duration-200 ${
                  selectedStatusFilter === status
                    ? 'text-violet-300 border-b-2 border-violet-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Tasks Grid / List Area ── */}
      {isLoading ? (
        /* Loader state */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <TaskCardSkeleton key={i} />
          ))}
        </div>
      ) : tasks.length === 0 && !error ? (
        /* Large Global Empty State */
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/60 shadow-xl backdrop-blur-md max-w-xl mx-auto mt-8 transition-all hover:border-slate-700/60">
          <div className="w-16 h-16 rounded-full bg-slate-800/40 border border-slate-750 flex items-center justify-center text-slate-400 mb-4">
            <ClipboardList size={32} strokeWidth={1.5} className="text-slate-400 animate-bounce" style={{ animationDuration: '3s' }} />
          </div>
          <h3 className="text-slate-200 text-base font-semibold mb-2">No tasks created yet</h3>
          <p className="text-slate-450 text-xs max-w-sm mb-6 leading-relaxed">
            Organize your progress goals by establishing tasks, linking them to technical competencies, and toggling status checks.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-500/5 hover:-translate-y-0.5"
          >
            Create Your First Task
          </button>
        </div>
      ) : filteredTasks.length === 0 && !error ? (
        /* Small Filter Empty State */
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center rounded-2xl border border-slate-800/40 bg-slate-900/10 max-w-md mx-auto mt-4">
          <Filter size={32} strokeWidth={1.5} className="text-slate-550 mb-3" />
          <h4 className="text-slate-350 text-sm font-semibold mb-1">No matching tasks</h4>
          <p className="text-slate-500 text-xs leading-relaxed">
            No tasks match your current search queries or filter selections. Try clearing keywords or selecting "All Skills".
          </p>
        </div>
      ) : (
        /* Render Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

      {/* ── Modals ── */}

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
