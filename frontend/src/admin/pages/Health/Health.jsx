import React from 'react'
import { TabTransition } from '../../constants/adminConfig'

export default function Health({ sysHealth }) {
  return (
    <TabTransition>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5 space-y-2">
          <p className="text-[10px] text-slate-400 uppercase font-bold">API Connectivity</p>
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Operational
          </div>
        </div>
        <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5 space-y-2">
          <p className="text-[10px] text-slate-400 uppercase font-bold">PostgreSQL Engine</p>
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <span className={`w-2 h-2 rounded-full animate-pulse ${
              sysHealth.database_status === 'Healthy' ? 'bg-emerald-500' : 'bg-rose-500'
            }`} /> {sysHealth.database_status}
          </div>
        </div>
        <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5 space-y-2">
          <p className="text-[10px] text-slate-400 uppercase font-bold">SMTP Client</p>
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <span className={`w-2 h-2 rounded-full animate-pulse ${
              sysHealth.smtp_status === 'Healthy' ? 'bg-emerald-500' : 'bg-rose-500'
            }`} /> {sysHealth.smtp_status}
          </div>
        </div>
      </div>
    </TabTransition>
  )
}
