import React from 'react'
import { Plus, ShieldAlert } from 'lucide-react'
import { TabTransition } from '../../constants/adminConfig'

export default function Roles({ rolesList, permissionsList, setRoleForm, setRoleFormOpen, setSelectedEditRole, handleDeleteRole }) {
  return (
    <TabTransition>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-white">Roles &amp; Permissions Matrix</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage user authorization groups and system permissions mappings.</p>
        </div>
        <button
          onClick={() => {
            setSelectedEditRole(null)
            setRoleForm({ name: '', permissions: [] })
            setRoleFormOpen(true)
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-xs font-semibold rounded-lg text-white cursor-pointer"
        >
          <Plus size={14} /> Create Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rolesList.map((role) => (
          <div key={role.id} className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <ShieldAlert size={16} className="text-purple-400" />
                  {role.name}
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedEditRole(role)
                      setRoleForm({ name: role.name, permissions: role.permissions })
                      setRoleFormOpen(true)
                    }}
                    className="px-2 py-1 bg-white/5 border border-white/10 text-slate-300 rounded text-[10px] font-bold cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRole(role.id)}
                    className="px-2 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-440 rounded text-[10px] font-bold cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 pt-3">
                <p className="text-[10px] text-slate-550 font-bold uppercase">Permissions mapping ({role.permissions_list.length})</p>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pt-1">
                  {role.permissions_list.map((p) => (
                    <span key={p.id} className="text-[9px] bg-purple-500/10 border border-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </TabTransition>
  )
}
