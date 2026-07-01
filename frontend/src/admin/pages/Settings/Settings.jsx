import React from 'react'
import { TabTransition } from '../../constants/adminConfig'

export default function Settings({ appSettings, setAppSettings, handleSettingsUpdate }) {
  return (
    <TabTransition>
      <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-6 max-w-xl">
        <h3 className="text-sm font-bold text-white mb-4">Application Configurations</h3>
        <form onSubmit={handleSettingsUpdate} className="space-y-4">
          {appSettings.map((item, idx) => (
            <div key={item.key} className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">{item.key}</label>
              <input
                type="text"
                value={item.value || ''}
                onChange={(e) => {
                  const updated = [...appSettings]
                  updated[idx].value = e.target.value
                  setAppSettings(updated)
                }}
                className="w-full bg-[#070B14] border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none"
              />
            </div>
          ))}
          <button type="submit" className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-xs font-semibold rounded-xl text-white cursor-pointer transition-all">
            Commit Configs Changes
          </button>
        </form>
      </div>
    </TabTransition>
  )
}
