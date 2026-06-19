import React, { useState, useEffect } from 'react'
import tasksService from '../../services/tasksService'
import { X, AlertCircle, Loader2 } from 'lucide-react'

/**
 * TaskModal
 *
 * Modal form for Creating or Editing a task.
 *
 * Props:
 *   - isOpen: boolean control
 *   - onClose: function to close the modal
 *   - onSaveSuccess: callback function triggered after a successful save
 *   - editTask: the task object if in Edit mode, null/undefined if in Create mode
 *   - skills: list of skills available to populate the dropdown selector
 */
export default function TaskModal({ isOpen, onClose, onSaveSuccess, editTask, skills = [] }) {
  const isEditMode = !!editTask

  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [skillId, setSkillId] = useState('')
  const [status, setStatus] = useState('pending')

  // API states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState(null)

  // Reset or pre-populate states on open/editTask changes
  useEffect(() => {
    if (isOpen) {
      if (editTask) {
        setTitle(editTask.title)
        setDescription(editTask.description || '')
        setSkillId(editTask.skill.toString())
        setStatus(editTask.status || 'pending')
      } else {
        setTitle('')
        setDescription('')
        // Default to first skill if available
        setSkillId(skills.length > 0 ? skills[0].id.toString() : '')
        setStatus('pending')
      }
      setApiError(null)
      setIsSubmitting(false)
    }
  }, [isOpen, editTask, skills])

  if (!isOpen) return null

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      setApiError('Task title is required')
      return
    }
    if (!skillId) {
      setApiError('Skill association is required')
      return
    }

    setIsSubmitting(true)
    setApiError(null)

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      skill: parseInt(skillId, 10),
      status: status,
    }

    try {
      if (isEditMode) {
        await tasksService.update(editTask.id, payload)
      } else {
        await tasksService.create(payload)
      }
      onSaveSuccess()
      onClose()
    } catch (err) {
      let errorMessage = 'An error occurred. Please try again.'
      if (err.response?.data) {
        const data = err.response.data
        if (typeof data === 'object') {
          const errors = Object.entries(data).map(([field, msgs]) => {
            const fieldLabel = field === 'non_field_errors' ? '' : `${field}: `
            const msgsText = Array.isArray(msgs) ? msgs.join(' ') : String(msgs)
            return `${fieldLabel}${msgsText}`
          })
          errorMessage = errors.join(' | ')
        } else if (typeof data === 'string') {
          errorMessage = data
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      setApiError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Find the selected skill color to show as a dynamic glow
  const selectedSkill = skills.find((s) => s.id.toString() === skillId)
  const glowColor = selectedSkill?.color ?? '#6366f1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-all duration-300">
      {/* Modal Container */}
      <div
        className="bg-[#131b2e]/95 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto animate-fade-in scrollbar-thin scrollbar-thumb-slate-800"
        role="dialog"
        aria-modal="true"
      >
        {/* Background glow matching selected skill color */}
        <div
          className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-5 transition-all duration-500 pointer-events-none"
          style={{ backgroundColor: glowColor }}
        />

        {/* Modal Header */}
        <div className="flex justify-between items-center mb-6 border-b border-slate-800/60 pb-3">
          <h2 className="text-slate-100 text-lg font-bold">
            {isEditMode ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Check if skills exist */}
        {skills.length === 0 ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 mx-auto">
              <AlertCircle size={24} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-slate-200 text-sm font-semibold">No skills available</h3>
              <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">
                Tasks must be associated with a skill. Please define a skill on the Skills page before adding tasks.
              </p>
            </div>
            <a
              href="/skills"
              className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/15 transition-all"
            >
              Go to Skills Page
            </a>
          </div>
        ) : (
          /* Modal Form */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Alert */}
            {apiError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/50 text-red-300 text-xs flex items-start gap-2.5">
                <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
                <span>{apiError}</span>
              </div>
            )}

            {/* Task Title */}
            <div>
              <label htmlFor="task-title" className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Task Title
              </label>
              <input
                id="task-title"
                type="text"
                required
                placeholder="e.g. Complete module 3 exercises, Draw wireframes"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950/40 border border-slate-800 focus:border-indigo-500/60 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none transition-all placeholder-slate-600 focus:ring-1 focus:ring-indigo-500/30"
                autoFocus
              />
            </div>

            {/* Associated Skill */}
            <div>
              <label htmlFor="task-skill" className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Associated Skill
              </label>
              <select
                id="task-skill"
                required
                value={skillId}
                onChange={(e) => setSkillId(e.target.value)}
                className="w-full bg-slate-950/40 border border-slate-800 focus:border-indigo-500/60 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none transition-all focus:ring-1 focus:ring-indigo-500/30 cursor-pointer"
              >
                {skills.map((skill) => (
                  <option key={skill.id} value={skill.id} className="bg-[#131b2e] text-slate-200">
                    {skill.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="task-desc" className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="task-desc"
                rows="3"
                placeholder="Describe details, references, or instructions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950/40 border border-slate-800 focus:border-indigo-500/60 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none transition-all placeholder-slate-600 focus:ring-1 focus:ring-indigo-500/30 resize-none"
              />
            </div>

            {/* Status (Only in edit mode) */}
            {isEditMode && (
              <div>
                <label htmlFor="task-status" className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Status
                </label>
                <select
                  id="task-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800 focus:border-indigo-500/60 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none transition-all focus:ring-1 focus:ring-indigo-500/30 cursor-pointer"
                >
                  <option value="pending" className="bg-[#131b2e] text-slate-200">Pending</option>
                  <option value="completed" className="bg-[#131b2e] text-slate-200">Completed</option>
                </select>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800/60 text-slate-350 hover:text-slate-200 text-sm font-medium transition-colors cursor-pointer"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-2"
                disabled={isSubmitting}
                style={!isSubmitting ? { backgroundImage: `linear-gradient(to right, ${glowColor}, #6366f1)` } : {}}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 text-white" />
                    <span>Saving...</span>
                  </>
                ) : isEditMode ? (
                  'Save Changes'
                ) : (
                  'Create Task'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
