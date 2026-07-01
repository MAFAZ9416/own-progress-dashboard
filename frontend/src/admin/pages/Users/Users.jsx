import React from 'react'
import { Search, Plus, Eye, Power, Key, Settings, Trash2 } from 'lucide-react'
import { TabTransition } from '../../constants/adminConfig'

export default function Users({ usersList, userSearch, setUserSearch, viewUserHistory, handleToggleUserStatus, setSelectedUserDetail, setUserResetPassOpen, setUserForm, setUserEditModalOpen, handleDeleteUser }) {
  return (
    <TabTransition>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-white">Users</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage permissions, status flags, and resetting credentials.</p>
        </div>
        <button
          onClick={() => {
            setSelectedUserDetail(null)
            setUserForm({ username: '', email: '', password: '', full_name: '', is_staff: false })
            setUserEditModalOpen(true)
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-xs font-semibold rounded-lg text-white cursor-pointer"
        >
          <Plus size={14} /> Create User
        </button>
      </div>

      <div className="bg-[#111827]/40 border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 flex flex-wrap justify-between items-center gap-3 border-b border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-2 bg-[#070B14]/40 px-3 py-1.5 rounded-xl border border-white/5">
            <Search size={14} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-100 outline-none w-44"
            />
          </div>
        </div>

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/5 text-slate-450 uppercase font-bold text-[10px]">
              <th className="p-4">Name / Username</th>
              <th className="p-4">Status</th>
              <th className="p-4">Role</th>
              <th className="p-4">Joined Date</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {usersList.map((user) => (
              <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                <td className="p-4">
                  <p className="font-bold text-white">{user.profile?.full_name || 'No name set'}</p>
                  <p className="text-[10px] text-slate-500">{user.email}</p>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    user.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>{user.is_active ? 'Active' : 'Disabled'}</span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    user.is_staff ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-800 text-slate-400'
                  }`}>{user.is_staff ? 'Staff' : 'User'}</span>
                </td>
                <td className="p-4 text-slate-500">{user.date_joined.split('T')[0]}</td>
                <td className="p-4 text-right space-x-1.5">
                  <button onClick={() => viewUserHistory(user)} className="p-1 rounded bg-white/5 border border-white/5 hover:bg-white/10 text-slate-350 cursor-pointer">
                    <Eye size={12} />
                  </button>
                  <button onClick={() => handleToggleUserStatus(user.id)} className="p-1 rounded bg-white/5 border border-white/5 hover:bg-white/10 text-slate-350 cursor-pointer">
                    <Power size={12} />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedUserDetail(user)
                      setUserResetPassOpen(true)
                    }}
                    className="p-1 rounded bg-white/5 border border-white/5 hover:bg-white/10 text-slate-350 cursor-pointer"
                  >
                    <Key size={12} />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedUserDetail(user)
                      setUserForm({
                        username: user.username,
                        email: user.email,
                        full_name: user.profile?.full_name || '',
                        is_staff: user.is_staff
                      })
                      setUserEditModalOpen(true)
                    }}
                    className="p-1 rounded bg-white/5 border border-white/5 hover:bg-white/10 text-slate-350 cursor-pointer"
                  >
                    <Settings size={12} />
                  </button>
                  <button onClick={() => handleDeleteUser(user.id)} className="p-1 rounded bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 cursor-pointer">
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TabTransition>
  )
}
