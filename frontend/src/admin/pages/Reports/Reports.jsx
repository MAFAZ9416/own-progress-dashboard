import React from 'react'
import { TabTransition } from '../../constants/adminConfig'

export default function Reports({ handleExport }) {
  return (
    <TabTransition>
      <div>
        <h1 className="text-lg font-bold text-white">Reports Central</h1>
        <p className="text-xs text-slate-400 mt-0.5">Download database collections in CSV format.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Users Report', desc: 'Active records of accounts data structures.', type: 'users' },
          { title: 'Skills Report', desc: 'Inventories of skill sets and targets.', type: 'skills' },
          { title: 'Tasks Report', desc: 'Tracking and status details of tasks.', type: 'tasks' },
          { title: 'Feedback Tickets', desc: 'User comments and resolving statuses.', type: 'feedback' }
        ].map((rep) => (
          <div key={rep.type} className="bg-[#111827]/40 border border-white/5 p-5 rounded-2xl flex flex-col justify-between hover:border-purple-500/20 transition-all duration-300">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white">{rep.title}</h4>
              <p className="text-[10px] text-slate-550 leading-relaxed">{rep.desc}</p>
            </div>
            <button
              onClick={() => handleExport(rep.type)}
              className="w-full mt-4 py-2 bg-white/5 hover:bg-purple-600 border border-white/10 hover:border-purple-500/30 text-white text-xs font-semibold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download CSV
            </button>
          </div>
        ))}
      </div>
    </TabTransition>
  )
}
