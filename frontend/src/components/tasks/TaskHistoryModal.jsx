import React, { useState, useEffect } from 'react'
import tasksService from '../../services/tasksService'
import { PlusCircle, Pencil, Check, RefreshCw, Trash2, RotateCcw, X, AlertCircle, History, Loader2, PlayCircle } from 'lucide-react'

const ACTION_DETAILS = {
  created: {
    label: 'Created',
    color: 'text-green-400 border-green-500/20 bg-green-500/10',
    icon: PlusCircle,
  },
  updated: {
    label: 'Updated',
    color: 'text-amber-400 border-amber-500/20 bg-amber-500/10',
    icon: Pencil,
  },
  completed: {
    label: 'Completed',
    color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
    icon: Check,
  },
  reopened: {
    label: 'Reopened',
    color: 'text-indigo-400 border-indigo-500/25 bg-indigo-500/10',
    icon: RefreshCw,
  },
  deleted: {
    label: 'Deleted',
    color: 'text-red-400 border-red-500/20 bg-red-500/10',
    icon: Trash2,
  },
  restored: {
    label: 'Restored',
    color: 'text-blue-400 border-blue-500/20 bg-blue-500/10',
    icon: RotateCcw,
  },
}

/**
 * TaskHistoryModal
 *
 * Displays a premium vertical timeline of task audit activity events.
 *
 * Props:
 *   - isOpen: boolean control
 *   - onClose: function to close the modal
 *   - task: the task object we are viewing audit logs for
 */
export default function TaskHistoryModal({ isOpen, onClose, task }) {
  const [activities, setActivities] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch audit log on open
  useEffect(() => {
    if (isOpen && task) {
      const fetchActivity = async () => {
        setIsLoading(true)
        setError(null)
        try {
          const data = await tasksService.getActivity(task.id)
          setActivities(data || [])
        } catch (err) {
          setError(
            err?.response?.data?.detail ??
            err?.response?.data?.message ??
            err?.message ??
            'Failed to fetch task activity log.'
          )
        } finally {
          setIsLoading(false)
        }
      }

      fetchActivity()
    }
  }, [isOpen, task])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-all duration-300">
      {/* Modal Container */}
      <div
        className="bg-[#131b2e]/95 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-fade-in"
        role="dialog"
        aria-modal="true"
      >
        {/* Decorative background accent */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-5 bg-indigo-500 pointer-events-none" />

        {/* Modal Header */}
        <div className="flex justify-between items-center mb-5 border-b border-slate-800/60 pb-3 shrink-0">
          <div>
            <h2 className="text-slate-100 text-base font-bold">Activity Audit Timeline</h2>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[280px]" title={task?.title}>
              {task?.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
          {isLoading ? (
            /* Loading State */
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="animate-spin h-6 w-6 text-indigo-500" />
              <span className="text-slate-400 text-xs font-medium">Loading timeline...</span>
            </div>
          ) : error ? (
            /* Error State */
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/50 text-red-300 text-xs flex items-center gap-2.5 my-2">
              <AlertCircle size={15} className="text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          ) : activities.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12 space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-800/30 border border-slate-700/50 flex items-center justify-center text-slate-400 mx-auto">
                <History size={18} />
              </div>
              <h4 className="text-slate-350 text-xs font-semibold">No activity logs recorded</h4>
              <p className="text-slate-500 text-[10px] max-w-xs mx-auto leading-relaxed">
                Logs will appear as task events occur.
              </p>
            </div>
          ) : (
            /* Vertical Timeline UI */
            <div className="relative border-l border-slate-800 pl-4 ml-3 py-2 space-y-5">
              {activities.map((item, index) => {
                // Get display configurations based on action name
                const details = ACTION_DETAILS[item.action.toLowerCase()] ?? {
                  label: item.action,
                  color: 'text-slate-300 border-slate-800 bg-slate-900',
                  icon: PlayCircle,
                }
                const IconComponent = details.icon || PlayCircle

                // Format timestamp
                const logTime = new Date(item.created_at).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })

                return (
                  <div key={item.id || index} className="relative flex items-start gap-3 group animate-slide-up">
                    {/* Timeline Node Ring containing action icon */}
                    <span className="absolute -left-[27px] mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#131b2e] border border-slate-800 text-xs shadow-md select-none text-slate-400">
                      <IconComponent size={12} strokeWidth={2.5} />
                    </span>

                    {/* Timeline Box */}
                    <div className="flex-1 bg-slate-900/40 border border-slate-850 p-3.5 rounded-xl hover:bg-slate-900/60 hover:border-slate-800 transition-all duration-200">
                      <div className="flex justify-between items-center">
                        <span className={`text-xs font-bold ${details.color.split(' ')[0]}`}>
                          {details.label}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          #{activities.length - index}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                        Event recorded: {logTime}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800/60 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
