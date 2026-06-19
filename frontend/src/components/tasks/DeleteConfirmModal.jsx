import React from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'

/**
 * DeleteConfirmModal
 *
 * Custom confirmation dialog for deleting a task.
 *
 * Props:
 *   - isOpen: boolean control
 *   - onClose: function to close the modal
 *   - onConfirm: function triggered when confirmation is clicked
 *   - taskTitle: the title of the task to delete
 *   - isDeleting: API deletion status
 */
export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, taskTitle, isDeleting }) {
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
            <AlertTriangle size={24} />
          </div>
          <div>
            <h2 className="text-slate-100 text-lg font-bold">Delete Task</h2>
            <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone.</p>
          </div>
        </div>

        {/* Content */}
        <p className="text-slate-350 text-sm leading-relaxed mb-6">
          Are you sure you want to delete the task <span className="text-slate-100 font-bold">"{taskTitle}"</span>?
          This will permanently remove it from your dashboard history.
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
                <Loader2 className="animate-spin h-4 w-4 text-white" />
                <span>Deleting...</span>
              </>
            ) : (
              'Delete Task'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
