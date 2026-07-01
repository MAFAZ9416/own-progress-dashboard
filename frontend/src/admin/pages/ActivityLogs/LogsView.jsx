import React from 'react'
import { TabTransition } from '../../constants/adminConfig'

export default function LogsView({ activityLogs, logSeverityFilter, setLogSeverityFilter }) {
  return (
    <TabTransition>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-white">System Audit Logs</h1>
          <p className="text-xs text-slate-400 mt-0.5">Audits modifications, config alterations, and backups.</p>
        </div>
        <select
          value={logSeverityFilter}
          onChange={(e) => setLogSeverityFilter(e.target.value)}
          className="bg-[#111827] border border-white/5 text-xs text-slate-350 px-3 py-1.5 rounded-xl outline-none"
        >
          <option value="all">All Severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="danger">Danger</option>
        </select>
      </div>

      <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5 space-y-4">
        {activityLogs.map((log) => (
          <div key={log.id} className="flex justify-between items-start text-xs border-b border-white/5 pb-3 last:border-none last:pb-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  log.severity === 'danger' ? 'bg-rose-500/10 text-rose-400' :
                  log.severity === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-purple-500/10 text-purple-400'
                }`}>{log.severity}</span>
                <span className="font-bold text-white">{log.action}</span>
              </div>
              <p className="text-slate-400 text-[11px]">{log.details}</p>
              <p className="text-[10px] text-slate-500">By {log.actor_email || 'System'} | IP: {log.ip_address || 'N/A'}</p>
            </div>
            <span className="text-[10px] text-slate-500">{new Date(log.created_at).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </TabTransition>
  )
}
