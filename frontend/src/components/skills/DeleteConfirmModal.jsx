import React from 'react'

/**
 * DeleteConfirmModal
 *
 * Glassmorphic custom confirmation dialog for deleting a skill.
 *
 * Props:
 *   - isOpen: boolean control
 *   - onClose: function to close the modal
 *   - onConfirm: function triggered when confirmation is clicked
 *   - skillName: the name of the skill to delete
 *   - isDeleting: boolean representing active API request status
 */
export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, skillName, isDeleting }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-all duration-300">
      {/* Modal Container */}
      <div
        className="bg-[#131b2e]/95 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl overflow-hidden animate-fade-in"
        role="dialog"
        aria-modal="true"
      >
        {/* Warning Icon Banner */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-950/40 border border-red-900/50 flex items-center justify-center text-red-400 shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h2 className="text-slate-100 text-lg font-bold">Delete Skill</h2>
            <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone.</p>
          </div>
        </div>

        {/* Content */}
        <p className="text-slate-350 text-sm leading-relaxed mb-6">
          Are you sure you want to delete the skill <span className="text-slate-100 font-bold">"{skillName}"</span>?
          This will also detach any tasks associated with it.
        </p>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800/60 text-slate-350 hover:text-slate-200 text-sm font-medium transition-colors cursor-pointer"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl bg-red-650 hover:bg-red-650/90 text-white text-sm font-semibold shadow-lg shadow-red-900/10 hover:shadow-red-900/20 transition-all cursor-pointer flex items-center gap-2"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Deleting...</span>
              </>
            ) : (
              'Delete Skill'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
