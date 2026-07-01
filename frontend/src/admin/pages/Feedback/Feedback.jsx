import React from 'react'
import { Trash2 } from 'lucide-react'
import { TabTransition } from '../../constants/adminConfig'

export default function Feedback({ feedbackList, setSelectedFb, setFbReplyOpen, handleDeleteFb }) {
  return (
    <TabTransition>
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold text-white">Feedback Moderation</h1>
          <p className="text-xs text-slate-400 mt-0.5">Moderate incoming user feedback, tickets, and reply to resolve issues.</p>
        </div>

        <div className="bg-[#111827]/40 border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-450 uppercase font-bold text-[10px] bg-white/[0.01]">
                <th className="p-4">Sender</th>
                <th className="p-4">Type</th>
                <th className="p-4">Message</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {feedbackList.map((fb) => (
                <tr key={fb.id} className="border-b border-white/5 last:border-none">
                  <td className="p-4">
                    <p className="font-bold text-white">{fb.name || 'Anonymous'}</p>
                    <p className="text-[10px] text-slate-550">{fb.email || 'No email'}</p>
                  </td>
                  <td className="p-4 text-slate-400">{fb.feedback_type}</td>
                  <td className="p-4 max-w-xs truncate text-slate-350" title={fb.message}>{fb.message}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      fb.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>{fb.status}</span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {fb.status === 'pending' && (
                      <button
                        onClick={() => {
                          setSelectedFb(fb)
                          setFbReplyOpen(true)
                        }}
                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-[10px] font-semibold rounded-lg text-white cursor-pointer"
                      >
                        Reply &amp; Resolve
                      </button>
                    )}
                    <button onClick={() => handleDeleteFb(fb.id)} className="p-1 rounded bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-450 cursor-pointer">
                      <Trash2 size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </TabTransition>
  )
}
