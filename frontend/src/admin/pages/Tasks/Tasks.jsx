import React from 'react'
import { Plus, Layout, Grid, List, Calendar, Clock, CheckSquare, Check, Settings, Trash2, RefreshCw } from 'lucide-react'
import { TabTransition } from '../../constants/adminConfig'

export default function Tasks({ tasksList, skillsList, taskViewMode, setTaskViewMode, setSelectedEditTask, setTaskForm, setTaskFormOpen, handleUpdateTaskStatus, handleDeleteTask }) {
  return (
    <TabTransition>
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-lg font-bold text-white">Tasks Board</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage user tasks using Kanban boards, lists, grids, or timeline components.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white/5 border border-white/5 p-1 rounded-xl">
            {[
              { mode: 'kanban', label: 'Kanban', icon: <Layout size={13} /> },
              { mode: 'grid', label: 'Grid', icon: <Grid size={13} /> },
              { mode: 'table', label: 'Table', icon: <List size={13} /> },
              { mode: 'timeline', label: 'Timeline', icon: <Calendar size={13} /> }
            ].map((v) => (
              <button
                key={v.mode}
                onClick={() => setTaskViewMode(v.mode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  taskViewMode === v.mode ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-450 hover:text-slate-200'
                }`}
              >
                {v.icon} {v.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setSelectedEditTask(null)
              setTaskForm({ title: '', description: '', status: 'pending', skill: skillsList[0]?.id || '' })
              setTaskFormOpen(true)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-xs font-semibold rounded-lg text-white cursor-pointer transition-all"
          >
            <Plus size={14} /> Add Task
          </button>
        </div>
      </div>

      {taskViewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-4 space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Clock size={14} className="text-amber-400" /> Pending Tasks
              </span>
              <span className="text-[10px] bg-amber-500/10 px-2 py-0.5 rounded text-amber-400 font-bold">
                {tasksList.filter(t => t.status !== 'completed').length}
              </span>
            </div>
            <div className="space-y-3">
              {tasksList.filter(t => t.status !== 'completed').map(task => (
                <div key={task.id} className="p-3.5 bg-[#0d111d] border border-white/5 rounded-xl space-y-2 hover:border-purple-500/20 transition-all">
                  <h4 className="font-bold text-white text-xs">{task.title}</h4>
                  <p className="text-[10px] text-slate-450 leading-relaxed">{task.description || 'No description set.'}</p>
                  <div className="flex justify-between items-center pt-2 border-t border-white/5">
                    <span className="text-[9px] bg-purple-500/10 px-2 py-0.5 rounded text-purple-400 font-bold">{task.skill_name}</span>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleUpdateTaskStatus(task, 'completed')} className="p-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 cursor-pointer">
                        <Check size={11} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedEditTask(task)
                          setTaskForm({ title: task.title, description: task.description, status: task.status, skill: task.skill })
                          setTaskFormOpen(true)
                        }}
                        className="p-1 rounded bg-white/5 text-slate-400 hover:bg-white/10 cursor-pointer"
                      >
                        <Settings size={11} />
                      </button>
                      <button onClick={() => handleDeleteTask(task.id)} className="p-1 rounded bg-rose-500/10 text-rose-450 hover:bg-rose-500/20 border border-rose-500/25 cursor-pointer">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-4 space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <CheckSquare size={14} className="text-emerald-400" /> Completed Tasks
              </span>
              <span className="text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded text-emerald-400 font-bold">
                {tasksList.filter(t => t.status === 'completed').length}
              </span>
            </div>
            <div className="space-y-3">
              {tasksList.filter(t => t.status === 'completed').map(task => (
                <div key={task.id} className="p-3.5 bg-[#0d111d] border border-white/5 rounded-xl space-y-2 hover:border-purple-500/20 transition-all opacity-85">
                  <h4 className="font-bold text-white text-xs line-through">{task.title}</h4>
                  <p className="text-[10px] text-slate-455 leading-relaxed">{task.description || 'No description set.'}</p>
                  <div className="flex justify-between items-center pt-2 border-t border-white/5">
                    <span className="text-[9px] bg-purple-500/10 px-2 py-0.5 rounded text-purple-400 font-bold">{task.skill_name}</span>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleUpdateTaskStatus(task, 'pending')} className="p-1 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 cursor-pointer">
                        <RefreshCw size={11} />
                      </button>
                      <button onClick={() => handleDeleteTask(task.id)} className="p-1 rounded bg-rose-500/10 text-rose-450 hover:bg-rose-500/20 border border-rose-500/25 cursor-pointer">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {taskViewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasksList.map(task => (
            <div key={task.id} className="bg-[#111827]/40 border border-white/5 p-4 rounded-2xl space-y-3 hover:shadow-[0_8px_32px_rgba(139,92,246,0.03)] transition-all">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-white text-xs max-w-[70%]">{task.title}</h4>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                }`}>{task.status}</span>
              </div>
              <p className="text-[10px] text-slate-455 leading-relaxed truncate">{task.description || 'No description'}</p>
              <div className="flex justify-between items-center pt-2.5 border-t border-white/5 text-[10px]">
                <span className="font-bold text-purple-400">{task.skill_name}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedEditTask(task)
                      setTaskForm({ title: task.title, description: task.description, status: task.status, skill: task.skill })
                      setTaskFormOpen(true)
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    Edit
                  </button>
                  <button onClick={() => handleDeleteTask(task.id)} className="text-rose-400 hover:text-rose-350">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {taskViewMode === 'table' && (
        <div className="bg-[#111827]/40 border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-450 uppercase font-bold text-[10px] bg-white/[0.01]">
                <th className="p-4">Title</th>
                <th className="p-4">Associated Skill</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasksList.map(task => (
                <tr key={task.id} className="border-b border-white/5 last:border-none">
                  <td className="p-4 font-bold text-white">{task.title}</td>
                  <td className="p-4 text-slate-400">{task.skill_name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>{task.status}</span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setSelectedEditTask(task)
                        setTaskForm({ title: task.title, description: task.description, status: task.status, skill: task.skill })
                        setTaskFormOpen(true)
                      }}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      Edit
                    </button>
                    <button onClick={() => handleDeleteTask(task.id)} className="text-rose-400 hover:text-rose-350 cursor-pointer">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {taskViewMode === 'timeline' && (
        <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5 space-y-4">
          {tasksList.map((task, idx) => (
            <div key={task.id} className="flex gap-4 relative">
              {idx !== tasksList.length - 1 && (
                <div className="absolute left-2.5 top-6 bottom-0 w-0.5 bg-slate-800" />
              )}
              <div className="w-5 h-5 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center font-bold text-[9px] text-purple-400 z-10 flex-shrink-0">
                {idx+1}
              </div>
              <div className="space-y-1 pb-4">
                <h4 className="font-bold text-white text-xs">{task.title}</h4>
                <p className="text-[10px] text-slate-500">Skill: {task.skill_name} | Status: <span className="text-slate-455 font-bold">{task.status}</span></p>
              </div>
            </div>
          ))}
        </div>
      )}
    </TabTransition>
  )
}
