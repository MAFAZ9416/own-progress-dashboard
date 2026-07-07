import React, { useState, memo, useMemo } from 'react'
import { Check, History, Pencil, Trash2, Calendar } from 'lucide-react'

/**
 * TaskCard — V3 Premium Redesign
 *
 * Large glassmorphic card with:
 *   - Large circular toggle checkbox (purple outline → filled on complete)
 *   - Bold white 20px title, 16px gray description
 *   - Skill badge (blue gradient pill), Status badge (amber/green), Due date
 *   - Three floating 48×48 circular action buttons (History, Edit, Delete)
 *   - Hover lift + purple glow animation via CSS
 *   - Skill-color left accent bar
 *
 * Props:
 *   - task: The task object from the API.
 *   - skills: Array of skills, used to resolve the task's skill color and name.
 *   - onEdit: Callback function when Edit is clicked.
 *   - onDelete: Callback function when Delete is clicked.
 *   - onToggleStatus: Callback function to mark task as completed or reopen it.
 *   - onViewHistory: Callback function to open completion history.
 */
export default memo(function TaskCard({ task, skills, onEdit, onDelete, onToggleStatus, onViewHistory }) {
  const [isToggling, setIsToggling] = useState(false)

  // Resolve associated skill
  const skillObj = skills.find((s) => s.id === task.skill)
  const skillName = skillObj?.name ?? 'Unknown Skill'
  const skillColor = skillObj?.color ?? '#4f46e5'

  const isCompleted = task.status === 'completed'
  const statusLabel = task.status === 'completed' ? 'Completed' : task.status === 'in_progress' ? 'In Progress' : 'Todo'
  const statusClass = task.status === 'completed' ? 'tc-card__badge--completed' : task.status === 'in_progress' ? 'tc-card__badge--pending' : 'tc-card__badge--pending'
  const priorityLabel = task.priority ? task.priority.replace('_', ' ') : 'medium'
  const priorityClass = task.priority === 'high' ? 'text-rose-400 border-rose-500/20 bg-rose-500/10' : task.priority === 'low' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 'text-amber-400 border-amber-500/20 bg-amber-500/10'

  const formattedDate = new Date(task.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null

  const isOverdue = useMemo(() => {
    if (!task.due_date || isCompleted) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(task.due_date)
    due.setHours(0, 0, 0, 0)
    return due < today
  }, [task.due_date, isCompleted])

  const handleToggle = async () => {
    if (isToggling) return
    setIsToggling(true)
    try {
      await onToggleStatus(task)
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <div
      className="tc-card"
      id={`task-card-${task.id}`}
      style={{
        '--skill-color': skillColor,
        '--skill-color-20': `${skillColor}33`,
      }}
    >
      {/* Skill-color left accent bar */}
      <div className="tc-card__accent" style={{ backgroundColor: skillColor }} />

      {/* Top glow orb (subtle) */}
      <div
        className="tc-card__glow"
        style={{ background: `radial-gradient(circle at 50% 0%, ${skillColor}18 0%, transparent 70%)` }}
      />

      {/* ── Main Content Row ── */}
      <div className="tc-card__body">
        {/* Circular checkbox toggle */}
        <button
          onClick={handleToggle}
          disabled={isToggling}
          className={`tc-card__check ${isCompleted ? 'tc-card__check--done' : 'tc-card__check--pending'}`}
          title={isCompleted ? 'Reopen Task' : 'Mark as Complete'}
          aria-label={isCompleted ? 'Mark task as todo' : 'Mark task as completed'}
        >
          {isCompleted ? (
            <Check size={18} strokeWidth={3} className="tc-card__check-icon" />
          ) : (
            <span className="tc-card__check-ring" />
          )}
        </button>

        {/* Title + Description */}
        <div className="tc-card__text">
          <h3
            className={`tc-card__title ${isCompleted ? 'tc-card__title--done' : ''}`}
            title={task.title}
          >
            {task.title}
          </h3>
          {task.description && (
            <p className="tc-card__desc">{task.description}</p>
          )}
        </div>

        {/* Action buttons cluster — floats to the right */}
        <div className="tc-card__actions">
          <button
            onClick={() => onViewHistory(task)}
            className="tc-card__action-btn tc-card__action-btn--history"
            title="View History"
            aria-label="View task history"
          >
            <History size={17} strokeWidth={2} />
          </button>
          <button
            onClick={() => onEdit(task)}
            className="tc-card__action-btn tc-card__action-btn--edit"
            title="Edit Task"
            aria-label="Edit task"
          >
            <Pencil size={17} strokeWidth={2} />
          </button>
          <button
            onClick={() => onDelete(task)}
            className="tc-card__action-btn tc-card__action-btn--delete"
            title="Delete Task"
            aria-label="Delete task"
          >
            <Trash2 size={17} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* ── Metadata Footer ── */}
      <div className="tc-card__footer">
        {/* Skill Badge */}
        <span className="tc-card__badge tc-card__badge--skill" style={{ '--skill-color': skillColor }}>
          {skillName}
        </span>

        {/* Status Badge */}
        <span
          className={`tc-card__badge ${statusClass}`}
        >
          {statusLabel}
        </span>

        <span className={`tc-card__badge border ${priorityClass}`}>
          {priorityLabel}
        </span>

        {/* Due Date */}
        <span className={`tc-card__date ${isOverdue ? 'text-rose-400 font-semibold' : ''}`}>
          <Calendar size={12} className="inline-block mr-1 opacity-60" />
          {dueDate ? (isOverdue ? `${dueDate} (Overdue)` : dueDate) : formattedDate}
        </span>
      </div>
    </div>
  )
})
