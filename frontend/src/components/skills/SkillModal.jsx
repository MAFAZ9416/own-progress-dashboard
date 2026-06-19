import React, { useState, useEffect } from 'react'
import skillsService from '../../services/skillsService'

const PRESET_COLORS = [
  '#7c3aed', // Purple/Violet
  '#3b82f6', // Royal Blue
  '#10b981', // Emerald Green
  '#f59e0b', // Amber Orange
  '#f43f5e', // Rose Red
  '#06b6d4', // Cyan/Teal
  '#d946ef', // Fuchsia/Magenta
]

/**
 * SkillModal
 *
 * Modal dialog for Creating or Editing a skill.
 * Manages form fields (name, target tasks, color) and handles API integration.
 *
 * Props:
 *   - isOpen: boolean control
 *   - onClose: function to close the modal
 *   - onSaveSuccess: callback function triggered after successful API request
 *   - editSkill: the skill object if in Edit mode, null/undefined if in Create mode
 */
export default function SkillModal({ isOpen, onClose, onSaveSuccess, editSkill }) {
  const isEditMode = !!editSkill

  // Form states
  const [name, setName] = useState('')
  const [targetTasks, setTargetTasks] = useState(10)
  const [color, setColor] = useState('#3b82f6')

  // API states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState(null)

  // Reset/populate fields when modal opens/closes or when editSkill changes
  useEffect(() => {
    if (isOpen) {
      if (editSkill) {
        setName(editSkill.name)
        setTargetTasks(editSkill.target_tasks)
        setColor(editSkill.color)
      } else {
        setName('')
        setTargetTasks(10)
        setColor('#3b82f6')
      }
      setApiError(null)
      setIsSubmitting(false)
    }
  }, [isOpen, editSkill])

  if (!isOpen) return null

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setApiError('Skill name is required')
      return
    }
    if (targetTasks < 1) {
      setApiError('Target tasks must be at least 1')
      return
    }

    setIsSubmitting(true)
    setApiError(null)

    const payload = {
      name: name.trim(),
      target_tasks: parseInt(targetTasks, 10),
      color: color,
    }

    try {
      if (isEditMode) {
        await skillsService.update(editSkill.id, payload)
      } else {
        await skillsService.create(payload)
      }
      onSaveSuccess()
      onClose()
    } catch (err) {
      // DRF field-specific validation errors extraction
      let errorMessage = 'An error occurred. Please try again.'
      if (err.response?.data) {
        const data = err.response.data
        if (typeof data === 'object') {
          // If name or other field has validation error, show it
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

  // Check if a color matches one of our presets
  const isPreset = PRESET_COLORS.includes(color.toLowerCase())

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-all duration-300">
      {/* Modal Container */}
      <div
        className="bg-[#131b2e]/95 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl overflow-hidden animate-fade-in"
        role="dialog"
        aria-modal="true"
      >
        {/* Background glow matching selected color */}
        <div
          className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-5 transition-all duration-500 pointer-events-none"
          style={{ backgroundColor: color }}
        />

        {/* Modal Header */}
        <div className="flex justify-between items-center mb-6 border-b border-slate-800/60 pb-3">
          <h2 className="text-slate-100 text-lg font-bold">
            {isEditMode ? 'Edit Skill' : 'Create New Skill'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Alert */}
        {apiError && (
          <div className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-900/50 text-red-300 text-xs flex items-start gap-2.5">
            <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{apiError}</span>
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Skill Name */}
          <div>
            <label htmlFor="skill-name" className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Skill Name
            </label>
            <input
              id="skill-name"
              type="text"
              required
              placeholder="e.g. React Native, Machine Learning, Piano"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950/40 border border-slate-800 focus:border-indigo-500/60 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none transition-all placeholder-slate-600 focus:ring-1 focus:ring-indigo-500/30"
              autoFocus
            />
          </div>

          {/* Target Tasks */}
          <div>
            <label htmlFor="target-tasks" className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Target Tasks
            </label>
            <input
              id="target-tasks"
              type="number"
              required
              min="1"
              value={targetTasks}
              onChange={(e) => setTargetTasks(e.target.value)}
              className="w-full bg-slate-950/40 border border-slate-800 focus:border-indigo-500/60 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none transition-all focus:ring-1 focus:ring-indigo-500/30"
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              The number of completed tasks required to master this skill.
            </p>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Theme Color
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {PRESET_COLORS.map((preset) => {
                const isSelected = color.toLowerCase() === preset.toLowerCase()
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setColor(preset)}
                    className="w-7 h-7 rounded-full cursor-pointer transition-transform hover:scale-110 active:scale-95 focus:outline-none relative flex items-center justify-center"
                    style={{ backgroundColor: preset }}
                    title={preset}
                  >
                    {isSelected && (
                      <span className="absolute inset-0 rounded-full border-2 border-white/60 animate-ping opacity-70" />
                    )}
                    {isSelected && (
                      <svg className="w-3.5 h-3.5 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                )
              })}

              {/* Custom Color Button */}
              <div className="relative flex items-center">
                <input
                  id="custom-color-picker"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 w-0 h-0 opacity-0 pointer-events-none"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('custom-color-picker').click()}
                  className={`w-7 h-7 rounded-full cursor-pointer bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 border border-slate-700/50 transition-all hover:scale-110 active:scale-95 flex items-center justify-center relative ${
                    !isPreset ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#131b2e]' : ''
                  }`}
                  title="Custom color..."
                >
                  <svg className="w-3.5 h-3.5 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Form Actions */}
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
              style={!isSubmitting ? { backgroundImage: `linear-gradient(to right, ${color}, #6366f1)` } : {}}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Saving...</span>
                </>
              ) : isEditMode ? (
                'Save Changes'
              ) : (
                'Create Skill'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
