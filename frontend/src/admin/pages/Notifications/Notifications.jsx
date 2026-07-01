import React from 'react'
import { TabTransition } from '../../constants/adminConfig'

export default function Notifications({ notifications, notifForm, setNotifForm, handleSendNotif }) {
  return (
    <TabTransition>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-[#111827]/40 border border-white/5 rounded-2xl p-5 space-y-4 h-fit">
          <h3 className="text-sm font-bold text-white">Broadcast Alerts</h3>
          <form onSubmit={handleSendNotif} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-bold">Alert Title</label>
              <input
                type="text"
                required
                placeholder="System notification..."
                value={notifForm.title}
                onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })}
                className="w-full bg-[#070B14] border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-bold">Message Details</label>
              <textarea
                required
                placeholder="Type alert message details..."
                value={notifForm.message}
                onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })}
                rows={4}
                className="w-full bg-[#070B14] border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none resize-none"
              />
            </div>
            <button type="submit" className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-xs font-semibold rounded-xl text-white cursor-pointer transition-all">
              Dispatch Broadcast Alert
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-white">Alert Dispatch Logs</h3>
          <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-4 space-y-3">
            {notifications.map((notif) => (
              <div key={notif.id} className="p-3 border border-white/5 rounded-xl bg-white/[0.01] text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">{notif.title}</span>
                  <span className="text-[9px] bg-purple-500/10 border border-purple-500/25 px-2 py-0.5 rounded text-purple-400 font-bold">Broadcast</span>
                </div>
                <p className="text-slate-400 text-[11px]">{notif.message}</p>
                <p className="text-[9px] text-slate-500 text-right">{new Date(notif.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TabTransition>
  )
}
