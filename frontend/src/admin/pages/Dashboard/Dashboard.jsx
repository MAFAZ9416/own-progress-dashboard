import React, { useMemo } from 'react'
import {
  Users, UserCheck, Plus, ClipboardList, Check, TrendingUp, Calendar, Download,
  Brain, Flame, MessageSquare, Mail, Database, Table, Layers, Activity,
  ArrowUpRight, AlertCircle, RefreshCw, Server, Shield
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { COLORS, TabTransition } from '../../constants/adminConfig'
import StatCard from '../../components/cards/StatCard'

export default function Dashboard({
  stats,
  dbInfo,
  sysHealth,
  usersList = [],
  skillsList = [],
  activityLogs = [],
  handleExport,
  setActiveTab
}) {

  // Format date range (current month)
  const dateRangeStr = useMemo(() => {
    const start = new Date()
    start.setDate(1)
    const end = new Date()
    end.setMonth(end.getMonth() + 1)
    end.setDate(0)
    
    const options = { month: 'short', day: 'numeric' }
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}, ${end.getFullYear()}`
  }, [])

  // Process top skills (from skillsList)
  const topSkills = useMemo(() => {
    // Sort skills by progress/target tasks or just take top 5
    return [...skillsList]
      .sort((a, b) => (b.progress || 0) - (a.progress || 0))
      .slice(0, 5)
  }, [skillsList])

  // Process recent users (from usersList)
  const recentUsers = useMemo(() => {
    return [...usersList]
      .sort((a, b) => new Date(b.date_joined) - new Date(a.date_joined))
      .slice(0, 5)
  }, [usersList])

  // Process recent activity logs
  const recentActivities = useMemo(() => {
    return [...activityLogs].slice(0, 5)
  }, [activityLogs])

  return (
    <TabTransition>
      {/* Row 1: Welcome back header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Welcome back, Admin! 👋
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">Here's what's happening with Progressly today.</p>
        </div>
        <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#111827]/60 border border-white/5 rounded-xl text-slate-400 text-xs font-semibold">
            <Calendar size={13} className="text-purple-400" />
            <span>{dateRangeStr}</span>
          </div>
          <button
            onClick={() => handleExport('users')}
            className="flex items-center justify-center gap-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white rounded-xl cursor-pointer transition-all shadow-md shadow-purple-900/10"
          >
            <Download size={13} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Row 2: 6 Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard
          title="Total Users"
          value={stats?.users?.total ?? 0}
          icon={<Users size={16} />}
          pct={`${stats?.users?.growth_pct ?? 0}%`}
          isPositive={(stats?.users?.growth_pct ?? 0) >= 0}
          iconColor="purple"
        />
        <StatCard
          title="Active Users"
          value={stats?.users?.active ?? 0}
          icon={<UserCheck size={16} />}
          pct="8.3%"
          isPositive={true}
          iconColor="emerald"
        />
        <StatCard
          title="New Users"
          value={stats?.users?.new_today ?? 0}
          icon={<Plus size={16} />}
          pct="18.7%"
          isPositive={true}
          iconColor="purple"
        />
        <StatCard
          title="Total Tasks"
          value={stats?.tasks?.total ?? 0}
          icon={<ClipboardList size={16} />}
          pct="11.2%"
          isPositive={true}
          iconColor="blue"
        />
        <StatCard
          title="Completed Tasks"
          value={stats?.tasks?.completed ?? 0}
          icon={<Check size={16} />}
          pct="14.6%"
          isPositive={true}
          iconColor="emerald"
        />
        <StatCard
          title="Completion Rate"
          value={`${stats?.tasks?.completion_rate ?? 0}%`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          }
          pct="5.6%"
          isPositive={true}
          iconColor="purple"
        />
      </div>

      {/* Row 3: User Growth Chart + Task Completion Donut + System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
        {/* User Growth (5/12 cols) */}
        <div className="lg:col-span-5 bg-[#111827]/40 border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">User Growth</h3>
            <select className="bg-[#070B14] border border-white/5 text-[10px] text-slate-300 font-semibold rounded-lg px-2.5 py-1 outline-none">
              <option>This Month</option>
            </select>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.charts?.registrations ?? []}>
                <defs>
                  <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.01)" vertical={false} />
                <XAxis dataKey="date" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#111827',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    fontSize: '10px',
                    color: '#fff'
                  }}
                />
                <Area type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#purpleGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Completion Overview (3/12 cols) */}
        <div className="lg:col-span-3 bg-[#111827]/40 border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Task Completion Overview</h3>
            <select className="bg-[#070B14] border border-white/5 text-[10px] text-slate-300 font-semibold rounded-lg px-2.5 py-1 outline-none">
              <option>This Month</option>
            </select>
          </div>
          <div className="h-36 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Completed', value: stats?.tasks?.completed ?? 0 },
                    { name: 'Pending', value: stats?.tasks?.pending ?? 0 },
                    { name: 'Overdue', value: stats?.tasks?.overdue ?? 0 }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={56}
                  paddingAngle={3}
                  dataKey="value"
                >
                  <Cell fill={COLORS.emerald} />
                  <Cell fill={COLORS.amber} />
                  <Cell fill={COLORS.rose} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-base font-black text-white">{stats?.tasks?.completion_rate ?? 0}%</span>
              <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Completed</span>
            </div>
          </div>
          <div className="space-y-1.5 text-[10px] mt-2">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Completed
              </span>
              <span className="font-bold text-white">{stats?.tasks?.completed ?? 0} ({stats?.tasks?.completion_rate ?? 0}%)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Pending
              </span>
              <span className="font-bold text-white">{stats?.tasks?.pending ?? 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Overdue
              </span>
              <span className="font-bold text-white">{stats?.tasks?.overdue ?? 0}</span>
            </div>
          </div>
        </div>

        {/* System Health Panel (4/12 cols) */}
        <div className="lg:col-span-4 bg-[#111827]/40 border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">System Health</h3>
            <button
              onClick={() => setActiveTab('health')}
              className="text-[10px] text-purple-400 hover:text-purple-300 font-bold transition-all cursor-pointer"
            >
              View All
            </button>
          </div>
          
          <div className="space-y-2 flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-center py-0.5">
              <span className="flex items-center gap-2 text-slate-400 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> API Status
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/10 px-2 py-0.5 rounded-lg">
                {sysHealth?.api_status === 'Healthy' ? 'Operational' : 'Issues Detected'}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="flex items-center gap-2 text-slate-400 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Database
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/10 px-2 py-0.5 rounded-lg">
                {sysHealth?.database_status === 'Healthy' ? 'Operational' : 'Issues Detected'}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="flex items-center gap-2 text-slate-400 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Email Service
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/10 px-2 py-0.5 rounded-lg">
                {sysHealth?.smtp_status === 'Healthy' ? 'Operational' : 'Issues Detected'}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="flex items-center gap-2 text-slate-400 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Storage
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/10 px-2 py-0.5 rounded-lg">
                Operational
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="flex items-center gap-2 text-slate-400 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Server
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/10 px-2 py-0.5 rounded-lg">
                Operational
              </span>
            </div>
          </div>

          <div className="border-t border-white/5 pt-3 mt-3 flex justify-between items-center text-[10px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Activity size={12} className="text-purple-400" />
              <span>Uptime</span>
            </div>
            <span className="font-bold text-white">99.9%</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5">
            <div className="flex items-center gap-1.5">
              <Server size={12} className="text-purple-400" />
              <span>Response Time</span>
            </div>
            <span className="font-bold text-white">128ms</span>
          </div>
        </div>

      </div>

      {/* Row 4: 4 Secondary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Skills"
          value={stats?.skills?.total ?? 0}
          icon={<Brain size={16} />}
          pct="9.7%"
          isPositive={true}
          iconColor="purple"
        />
        <StatCard
          title="Active Streaks"
          value={stats?.streaks?.average_streak ?? 0}
          icon={<Flame size={16} />}
          pct="11.1%"
          isPositive={true}
          iconColor="amber"
        />
        <StatCard
          title="Feedbacks"
          value={stats?.feedback?.total ?? 0}
          icon={<MessageSquare size={16} />}
          pct="7.3%"
          isPositive={true}
          iconColor="emerald"
        />
        <StatCard
          title="Emails Sent"
          value={stats?.emails?.total ?? 0}
          icon={<Mail size={16} />}
          pct="13.8%"
          isPositive={true}
          iconColor="blue"
        />
      </div>

      {/* Row 5: Top Skills + Recent Users + Database Overview + Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Top Skills (1/4 cols) */}
        <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Top Skills</h3>
            <button
              onClick={() => setActiveTab('skills')}
              className="text-[10px] text-purple-400 hover:text-purple-300 font-bold transition-all cursor-pointer"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {topSkills.length === 0 ? (
              <p className="text-slate-500 text-xs italic">No skills recorded yet</p>
            ) : (
              topSkills.map((skill, index) => (
                <div key={skill.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-200">
                      {index + 1}. {skill.name}
                    </span>
                    <span className="text-slate-400 text-[10px] font-bold">{Math.round(skill.progress)}%</span>
                  </div>
                  <div className="w-full bg-[#070B14] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(skill.progress, 100)}%`,
                        backgroundColor: skill.color || '#8B5CF6'
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Users (1/4 cols) */}
        <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Users</h3>
            <button
              onClick={() => setActiveTab('users')}
              className="text-[10px] text-purple-400 hover:text-purple-300 font-bold transition-all cursor-pointer"
            >
              View All
            </button>
          </div>
          <div className="space-y-3.5">
            {recentUsers.length === 0 ? (
              <p className="text-slate-500 text-xs italic">No users found</p>
            ) : (
              recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[10px] font-bold text-purple-400 uppercase">
                      {user.profile?.full_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200 leading-none">
                        {user.profile?.full_name || user.username}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[120px]">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-400 font-semibold">
                    {new Date(user.date_joined).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Database Overview (1/4 cols) */}
        <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Database Overview</h3>
            <button
              onClick={() => setActiveTab('database')}
              className="text-[10px] text-purple-400 hover:text-purple-300 font-bold transition-all cursor-pointer"
            >
              View All
            </button>
          </div>
          
          <div className="space-y-3.5 text-xs text-slate-400">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <Database size={13} className="text-purple-400" /> Database Size
              </span>
              <span className="font-semibold text-white">{dbInfo?.database_size || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <Table size={13} className="text-purple-400" /> Tables
              </span>
              <span className="font-semibold text-white">{dbInfo?.number_of_tables || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <Layers size={13} className="text-purple-400" /> Total Rows
              </span>
              <span className="font-semibold text-white">
                {dbInfo?.number_of_rows ? dbInfo.number_of_rows.toLocaleString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <Activity size={13} className="text-purple-400" /> Active Connections
              </span>
              <span className="font-semibold text-white">{dbInfo?.active_connections || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <Shield size={13} className="text-purple-400" /> Storage Used
              </span>
              <span className="font-semibold text-white">
                {dbInfo?.storage_used_pct ? `${dbInfo.storage_used_pct}%` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity (1/4 cols) */}
        <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Activity</h3>
            <button
              onClick={() => setActiveTab('logs')}
              className="text-[10px] text-purple-400 hover:text-purple-300 font-bold transition-all cursor-pointer"
            >
              View All
            </button>
          </div>
          
          <div className="space-y-3.5">
            {recentActivities.length === 0 ? (
              <p className="text-slate-500 text-xs italic">No activity logs recorded</p>
            ) : (
              recentActivities.map((log) => {
                const isDanger = log.severity === 'danger'
                const isWarning = log.severity === 'warning'
                return (
                  <div key={log.id} className="flex gap-2.5 items-start text-xs">
                    <div className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      isDanger ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-purple-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-200 leading-snug truncate">
                        {log.action}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                        {log.details}
                      </p>
                    </div>
                    <span className="text-[8px] text-slate-550 flex-shrink-0 font-bold uppercase">
                      {new Date(log.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>
    </TabTransition>
  )
}
