import React from 'react'
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { TabTransition } from '../../constants/adminConfig'

export default function Analytics({ stats }) {
  return (
    <TabTransition>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Daily Completions Rate</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.charts.completions}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                <XAxis dataKey="date" stroke="#475569" fontSize={9} />
                <YAxis stroke="#475569" fontSize={9} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }} />
                <Bar dataKey="completions" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Weekly Onboarding Rate</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.charts.registrations}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                <XAxis dataKey="date" stroke="#475569" fontSize={9} />
                <YAxis stroke="#475569" fontSize={9} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }} />
                <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </TabTransition>
  )
}
