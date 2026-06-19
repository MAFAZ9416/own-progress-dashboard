import React from 'react'

/**
 * SkillCard
 *
 * Displays a premium glassmorphic card for an individual skill.
 * Includes progress bar colored with skill's theme, task counters, and edit/delete controls.
 *
 * Props:
 *   - skill: The skill object from the backend API.
 *   - onEdit: Callback function when the edit button is clicked.
 *   - onDelete: Callback function when the delete button is clicked.
 */
export default function SkillCard({ skill, onEdit, onDelete }) {
  // Derive completed tasks from progress and target tasks
  const completedTasks = Math.round((skill.progress / 100) * skill.target_tasks)
  const remainingTasks = Math.max(0, skill.target_tasks - completedTasks)

  return (
    <div
      className="bg-slate-900/50 backdrop-blur-md border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/5 flex flex-col justify-between relative overflow-hidden group"
      id={`skill-card-${skill.id}`}
    >
      {/* Dynamic background glow based on skill color */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10 transition-all duration-300 group-hover:opacity-20 pointer-events-none"
        style={{ backgroundColor: skill.color }}
      />

      <div>
        <div className="flex justify-between items-start gap-4">
          <div className="min-w-0 flex-1">
            <h3
              className="text-slate-100 text-lg font-bold truncate group-hover:text-purple-400 transition-colors"
              title={skill.name}
            >
              {skill.name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {skill.target_tasks} target tasks
            </p>
          </div>

          {/* Action buttons - on desktop visible on hover, on mobile always visible */}
          <div className="flex items-center gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => onEdit(skill)}
              className="p-1.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 border border-slate-700/40 hover:border-slate-600 transition-all cursor-pointer"
              title="Edit Skill"
              aria-label={`Edit ${skill.name}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(skill)}
              className="p-1.5 rounded-lg bg-slate-800/40 hover:bg-slate-850 text-slate-400 hover:text-red-400 border border-slate-700/40 hover:border-slate-600 transition-all cursor-pointer"
              title="Delete Skill"
              aria-label={`Delete ${skill.name}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="mt-6 space-y-2">
        <div className="flex justify-between items-end text-xs font-semibold">
          <span className="text-slate-400">Progress</span>
          <span className="text-slate-200" style={{ color: skill.color }}>
            {skill.progress}%
          </span>
        </div>
        <div className="h-2 bg-slate-800/80 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${skill.progress}%`, backgroundColor: skill.color }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
          <span>{completedTasks} completed</span>
          <span>{remainingTasks} left</span>
        </div>
      </div>
    </div>
  )
}
