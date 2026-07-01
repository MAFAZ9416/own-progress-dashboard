import React from 'react'
import { Mail, Check, AlertCircle, Activity } from 'lucide-react'
import { TabTransition } from '../../constants/adminConfig'
import StatCard from '../../components/cards/StatCard'

export default function EmailLogs({ emailLogs, handleRetryEmail }) {
  return (
    <TabTransition>
      <div>
        <h1 className="text-lg font-bold text-white">System Email Logs</h1>
        <p className="text-xs text-slate-400 mt-0.5">Audit outgoing system logs, templates, delivery status, and retry failures.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total System Emails" value={emailLogs.length} icon={<Mail size={16} />} pct="100%" subtext="logs in queue" />
        <StatCard title="Successful Deliveries" value={emailLogs.filter(e => e.status === 'delivered').length} icon={<Check size={16} />} pct="+98.2%" subtext="operational" />
        <StatCard title="Delivery Failures" value={emailLogs.filter(e => e.status === 'failed').length} icon={<AlertCircle size={16} className="text-rose-400" />} pct="-1.8%" subtext="failures" isPositive={false} />
        <StatCard
          title="SMTP Success Rate"
          value={`${emailLogs.length > 0 ? ((emailLogs.filter(e => e.status === 'delivered').length / emailLogs.length) * 100).toFixed(1) : 100}%`}
          icon={<Activity size={16} className="text-emerald-400" />}
          pct="100%"
          subtext="healthy status"
        />
      </div>

      <div className="bg-[#111827]/40 border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/5 text-slate-450 uppercase font-bold text-[10px] bg-white/[0.01]">
              <th className="p-4">Recipient</th>
              <th className="p-4">Subject</th>
              <th className="p-4">Status</th>
              <th className="p-4">Time</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {emailLogs.map((log) => (
              <tr key={log.id} className="border-b border-white/5 last:border-none">
                <td className="p-4 font-bold text-white">{log.recipient}</td>
                <td className="p-4 text-slate-355">{log.subject}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    log.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>{log.status}</span>
                </td>
                <td className="p-4 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                <td className="p-4 text-right">
                  {log.status === 'failed' && (
                    <button
                      onClick={() => handleRetryEmail(log.id)}
                      className="px-2.5 py-1 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/25 rounded-lg font-bold text-[10px] cursor-pointer transition-all"
                    >
                      Retry Send
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TabTransition>
  )
}
