import React from 'react'
import { TabTransition } from '../../constants/adminConfig'

export default function Database({ dbInfo }) {
  return (
    <TabTransition>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#111827]/40 border border-white/5 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">PostgreSQL Schema Indexes</h3>
            <span className="text-[9px] bg-purple-500/10 border border-purple-500/25 px-2 py-0.5 rounded text-purple-400 font-bold">{dbInfo.database_type}</span>
          </div>
          <div className="space-y-2">
            {dbInfo.tables.map((t) => (
              <div key={t.name} className="flex justify-between items-center text-xs p-2.5 hover:bg-white/[0.01] rounded-xl border border-white/5">
                <span className="font-bold text-slate-200">{t.name}</span>
                <div className="flex gap-2">
                  <span className="text-[10px] text-slate-550">Rows: {t.rows}</span>
                  <span className="text-[10px] text-purple-400 font-bold">{t.size}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5 space-y-4 h-fit">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Database Engine</h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-455">Active Connections</span>
              <span className="font-bold text-white">{dbInfo.active_connections}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-455">Max Connection Limit</span>
              <span className="font-bold text-white">100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-455">SSL Mode</span>
              <span className="font-bold text-emerald-400">Required</span>
            </div>
          </div>
        </div>
      </div>
    </TabTransition>
  )
}
