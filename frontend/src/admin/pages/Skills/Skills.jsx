import React from 'react'
import { Plus } from 'lucide-react'
import { TabTransition } from '../../constants/adminConfig'

export default function Skills({ skillsList, setSelectedEditSkill, setSkillForm, setSkillFormOpen, handleDeleteSkill }) {
  return (
    <TabTransition>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-white">Skills Inventory</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage custom skill types and completion quotas.</p>
        </div>
        <button
          onClick={() => {
            setSelectedEditSkill(null)
            setSkillForm({ name: '', color: '#8B5CF6', target_tasks: 10 })
            setSkillFormOpen(true)
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-xs font-semibold rounded-lg text-white cursor-pointer"
        >
          <Plus size={14} /> Add Skill
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {skillsList.map((skill) => (
          <div key={skill.id} className="bg-[#111827]/40 border border-white/5 p-5 rounded-2xl space-y-4 flex flex-col justify-between hover:shadow-[0_8px_32px_rgba(139,92,246,0.05)] transition-all">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: skill.color }} />
                  <h4 className="font-bold text-white text-sm">{skill.name}</h4>
                </div>
                <span className="text-[10px] bg-purple-500/10 border border-purple-500/25 px-2 py-0.5 rounded text-purple-400 font-bold">Target: {skill.target_tasks}</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-slate-400 font-bold">
                  <span>Progress</span>
                  <span>{skill.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: `${skill.progress}%` }} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <button
                onClick={() => {
                  setSelectedEditSkill(skill)
                  setSkillForm({ name: skill.name, color: skill.color, target_tasks: skill.target_tasks })
                  setSkillFormOpen(true)
                }}
                className="px-2.5 py-1 text-[10px] font-bold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-lg cursor-pointer transition-all"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteSkill(skill.id)}
                className="px-2.5 py-1 text-[10px] font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-440 border border-rose-500/25 rounded-lg cursor-pointer transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </TabTransition>
  )
}
