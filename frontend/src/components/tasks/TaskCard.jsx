import React from 'react'
import { Check, History, Pencil, Trash2 } from 'lucide-react'

/**
 * TaskCard
 *
 * Displays a premium glassmorphic card representing a task.
 *
 * Props:
 *   - task: The task object from the API.
 *   - skills: Array of skills, used to resolve the task's skill color and name.
 *   - onEdit: Callback function when Edit is clicked.
 *   - onDelete: Callback function when Delete is clicked.
 *   - onToggleStatus: Callback function to mark task as completed or reopen it.
 *   - onViewHistory: Callback function to open completion history.
 */
export default function TaskCard({ task, skills, onEdit, onDelete, onToggleStatus, onViewHistory }) {
  // Resolve associated skill
  const skillObj = skills.find((s) => s.id === task.skill)
  const skillName = skillObj?.name ?? 'Unknown Skill'
  const skillColor = skillObj?.color ?? '#4f46e5' // Fallback Indigo

  const isCompleted = task.status === 'completed'
  const createdDate = new Date(task.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div
      className="bg-slate-900/65 backdrop-blur-xl border border-slate-800/80 rounded-[28px] p-5 sm:p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_60px_rgba(59,130,246,0.12)] flex flex-col gap-4 relative overflow-hidden group animate-fade-in"
      id={`task-card-${task.id}`}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 group-hover:w-2 pointer-events-none"
        style={{ backgroundColor: skillColor }}
      />

      <div className="flex items-start gap-4 w-full">
        <button
          onClick={() => onToggleStatus(task)}
          className="shrink-0 flex items-center justify-center rounded-2xl border border-slate-700/70 bg-slate-950/50 w-11 h-11 transition-all duration-200 hover:border-violet-400 hover:bg-violet-500/10 focus:outline-none"
          title={isCompleted ? 'Reopen Task' : 'Complete Task'}
          aria-label={isCompleted ? 'Mark task as pending' : 'Mark task as completed'}
        >
          {isCompleted ? (
            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-violet-500 text-white shadow-lg shadow-violet-500/20">
              <Check size={14} strokeWidth={3} />
            </div>
          ) : (
            <div className="w-5.5 h-5.5 rounded-full border-2 border-slate-600 transition-all duration-200" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <h3
            className={`font-semibold text-base sm:text-lg leading-tight ${
              isCompleted ? 'text-slate-500 line-through' : 'text-slate-100'
            }`}
            title={task.title}
          >
            {task.title}
          </h3>
          {task.description && (
            <p className="mt-2 text-sm leading-6 text-slate-400 break-words">
              {task.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:gap-0 sm:flex-row sm:items-center sm:justify-between py-3 border-t border-slate-800/50">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.22em] px-3 py-1 rounded-full border bg-slate-950/60"
            style={{
              color: skillColor,
              borderColor: `${skillColor}35`,
            }}
          >
            {skillName}
          </span>

          <span
            className={`text-[11px] font-semibold uppercase tracking-[0.22em] px-3 py-1 rounded-full border ${
              isCompleted
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
            }`}
          >
            {isCompleted ? 'Completed' : 'Pending'}
          </span>

          <span className="text-[11px] text-slate-500 font-medium">
            {createdDate}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onViewHistory(task)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 border border-slate-800/60 text-slate-400 hover:border-slate-700 hover:text-emerald-300 transition-all duration-200"
            title="View History"
            aria-label="View history"
          >
            <History size={16} strokeWidth={2} />
          </button>
          <button
            onClick={() => onEdit(task)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 border border-slate-800/60 text-slate-400 hover:border-slate-700 hover:text-indigo-300 transition-all duration-200"
            title="Edit Task"
            aria-label="Edit task"
          >
            <Pencil size={16} strokeWidth={2} />
          </button>
          <button
            onClick={() => onDelete(task)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 border border-slate-800/60 text-slate-400 hover:border-slate-700 hover:text-rose-300 transition-all duration-200"
            title="Delete Task"
            aria-label="Delete task"
          >
            <Trash2 size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  )
}

