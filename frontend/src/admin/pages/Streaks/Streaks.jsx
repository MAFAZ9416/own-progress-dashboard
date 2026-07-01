import React from 'react'
import { TabTransition } from '../../constants/adminConfig'

export default function Streaks({ streakHeatmap }) {
  return (
    <TabTransition>
      <div>
        <h1 className="text-lg font-bold text-white">Daily Streak Heatmap</h1>
        <p className="text-xs text-slate-400 mt-0.5">Audit consecutive completion activity across days.</p>
      </div>

      <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Contribution Grid</h3>
        <div className="flex flex-wrap gap-1.5">
          {streakHeatmap.map((day, idx) => (
            <div
              key={idx}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[8px] font-bold"
              style={{
                backgroundColor: day.count === 0 ? 'rgba(255,255,255,0.02)' :
                                day.count === 1 ? 'rgba(139,92,246,0.15)' :
                                day.count === 2 ? 'rgba(139,92,246,0.35)' :
                                day.count === 3 ? 'rgba(139,92,246,0.6)' :
                                'rgba(139,92,246,0.9)',
                color: day.count > 0 ? '#fff' : '#64748b',
                border: '1px solid rgba(255,255,255,0.04)'
              }}
              title={`${day.date}: ${day.count} completions`}
            >
              {new Date(day.date).getDate()}
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-4 pt-3 border-t border-white/5">
          <span>Less active</span>
          <div className="flex gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-white/5 border border-white/10" />
            <span className="w-3.5 h-3.5 rounded bg-purple-500/20" />
            <span className="w-3.5 h-3.5 rounded bg-purple-500/40" />
            <span className="w-3.5 h-3.5 rounded bg-purple-500/70" />
            <span className="w-3.5 h-3.5 rounded bg-purple-500" />
          </div>
          <span>More active</span>
        </div>
      </div>
    </TabTransition>
  )
}
