import React from 'react'
import { TabTransition } from '../../constants/adminConfig'

export default function Backup({ backups, triggerBackup, handleRestore }) {
  return (
    <TabTransition>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-white">Backups &amp; Snapshots</h1>
          <p className="text-xs text-slate-400 mt-0.5">Export backup fixtures or restore previous states.</p>
        </div>
        <button
          onClick={triggerBackup}
          className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-xs font-semibold rounded-xl text-white cursor-pointer transition-all"
        >
          Dump Snapshot
        </button>
      </div>

      <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5 space-y-3">
        {backups.map((b) => (
          <div key={b.id} className="flex justify-between items-center text-xs p-3 border border-white/5 rounded-xl bg-white/[0.01]">
            <div>
              <p className="font-bold text-white">{b.filename}</p>
              <p className="text-[9px] text-slate-550">{(b.size_bytes / 1024).toFixed(1)} KB | {new Date(b.created_at).toLocaleString()}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleRestore(b.id)}
                className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/25 rounded-lg cursor-pointer font-bold text-[9px]"
              >
                Restore
              </button>
              <a
                href={`${import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'}/admin/backups/${b.id}/download/`}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 rounded-lg cursor-pointer font-bold text-[9px]"
                target="_blank"
                rel="noreferrer"
              >
                Download
              </a>
            </div>
          </div>
        ))}
      </div>
    </TabTransition>
  )
}
