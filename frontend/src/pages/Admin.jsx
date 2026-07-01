import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import {
  Users as UsersIcon, ClipboardList, Brain, Flame, Mail, MessageSquare, Database as DatabaseIcon,
  Activity, Shield, Settings as SettingsIcon, RefreshCw, Search, X, Sun, Moon, Menu, Bell,
  Layout, TrendingUp, List
} from 'lucide-react'

// Import feature-based views
import SkeletonLoader from '../admin/components/loaders/SkeletonLoader'
import Dashboard from '../admin/pages/Dashboard/Dashboard'
import Users from '../admin/pages/Users/Users'
import Skills from '../admin/pages/Skills/Skills'
import Tasks from '../admin/pages/Tasks/Tasks'
import Streaks from '../admin/pages/Streaks/Streaks'
import Feedback from '../admin/pages/Feedback/Feedback'
import EmailLogs from '../admin/pages/EmailLogs/EmailLogs'
import Notifications from '../admin/pages/Notifications/Notifications'
import Analytics from '../admin/pages/Analytics/Analytics'
import Reports from '../admin/pages/Reports/Reports'
import Database from '../admin/pages/Database/Database'
import Health from '../admin/pages/Health/Health'
import Backup from '../admin/pages/Backup/Backup'
import Settings from '../admin/pages/Settings/Settings'
import LogsView from '../admin/pages/ActivityLogs/LogsView'
import Roles from '../admin/pages/Roles/Roles'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

import apiClient from '../api/apiClient'

export default function Admin() {
  const { user: authUser, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/admin/login', { replace: true })
  }

  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false)
  const [globalSearchQuery, setGlobalSearchQuery] = useState('')

  // Backend stats states
  const [stats, setStats] = useState(null)
  const [dbInfo, setDbInfo] = useState(null)
  const [sysHealth, setSysHealth] = useState(null)
  const [usersList, setUsersList] = useState([])
  const [skillsList, setSkillsList] = useState([])
  const [tasksList, setTasksList] = useState([])
  const [feedbackList, setFeedbackList] = useState([])
  const [emailLogs, setEmailLogs] = useState([])
  const [backups, setBackups] = useState([])
  const [appSettings, setAppSettings] = useState([])
  const [notifications, setNotifications] = useState([])
  const [activityLogs, setActivityLogs] = useState([])
  const [rolesList, setRolesList] = useState([])
  const [permissionsList, setPermissionsList] = useState([])

  // Search/Filters states
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('all')
  const [userStatusFilter, setUserStatusFilter] = useState('all')
  const [userEditModalOpen, setUserEditModalOpen] = useState(false)
  const [selectedUserDetail, setSelectedUserDetail] = useState(null)
  const [userForm, setUserForm] = useState({ username: '', email: '', password: '', full_name: '', is_staff: false })
  const [userHistoryModalOpen, setUserHistoryModalOpen] = useState(false)
  const [userHistory, setUserHistory] = useState([])
  const [userResetPassOpen, setUserResetPassOpen] = useState(false)
  const [userResetPassVal, setUserResetPassVal] = useState('')

  // Skills
  const [skillSearch, setSkillSearch] = useState('')
  const [skillFormOpen, setSkillFormOpen] = useState(false)
  const [skillForm, setSkillForm] = useState({ name: '', color: '#8B5CF6', target_tasks: 10 })
  const [selectedEditSkill, setSelectedEditSkill] = useState(null)

  // Tasks
  const [taskSearch, setTaskSearch] = useState('')
  const [taskStatusFilter, setTaskStatusFilter] = useState('all')
  const [taskViewMode, setTaskViewMode] = useState('kanban')
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [selectedEditTask, setSelectedEditTask] = useState(null)
  const [taskForm, setTaskForm] = useState({ title: '', description: '', status: 'pending', skill: '' })

  // Feedback ticket controls
  const [fbSearch, setFbSearch] = useState('')
  const [fbStatusFilter, setFbStatusFilter] = useState('all')
  const [fbReplyOpen, setFbReplyOpen] = useState(false)
  const [selectedFb, setSelectedFb] = useState(null)
  const [fbReplyText, setFbReplyText] = useState('')

  // Email Logs
  const [emailSearch, setEmailSearch] = useState('')
  const [emailStatusFilter, setEmailStatusFilter] = useState('all')

  // Notification form
  const [notifForm, setNotifForm] = useState({ title: '', message: '', recipient: '', scheduled_for: '' })

  // Activity logs filters
  const [logSearch, setLogSearch] = useState('')
  const [logSeverityFilter, setLogSeverityFilter] = useState('all')

  // Roles Form
  const [roleFormOpen, setRoleFormOpen] = useState(false)
  const [selectedEditRole, setSelectedEditRole] = useState(null)
  const [roleForm, setRoleForm] = useState({ name: '', permissions: [] })

  // Synchronizers
  const fetchStats = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/admin/stats/')
      setStats(data)
    } catch (e) { console.error("Error stats:", e) }
  }, [])

  const fetchDbInfo = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/admin/db-monitor/')
      setDbInfo(data)
    } catch (e) { console.error("Error db info:", e) }
  }, [])

  const fetchSysHealth = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/admin/system-health/')
      setSysHealth(data)
    } catch (e) { console.error("Error health:", e) }
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/admin/users/', {
        params: { search: userSearch, role: userRoleFilter, status: userStatusFilter }
      })
      setUsersList(data)
    } catch (e) { console.error("Error users:", e) }
  }, [userSearch, userRoleFilter, userStatusFilter])

  const fetchSkills = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/admin/skills/', { params: { search: skillSearch } })
      setSkillsList(data)
    } catch (e) { console.error("Error skills:", e) }
  }, [skillSearch])

  const fetchTasks = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/admin/tasks/', {
        params: { search: taskSearch, status: taskStatusFilter !== 'all' ? taskStatusFilter : undefined }
      })
      setTasksList(data)
    } catch (e) { console.error("Error tasks:", e) }
  }, [taskSearch, taskStatusFilter])

  const fetchFeedback = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/admin/feedback/', {
        params: { search: fbSearch, status: fbStatusFilter !== 'all' ? fbStatusFilter : undefined }
      })
      setFeedbackList(data)
    } catch (e) { console.error("Error feedback:", e) }
  }, [fbSearch, fbStatusFilter])

  const fetchEmailLogs = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/admin/emails/', {
        params: { search: emailSearch, status: emailStatusFilter !== 'all' ? emailStatusFilter : undefined }
      })
      setEmailLogs(data)
    } catch (e) { console.error("Error emails:", e) }
  }, [emailSearch, emailStatusFilter])

  const fetchBackups = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/admin/backups/')
      setBackups(data)
    } catch (e) { console.error("Error backups:", e) }
  }, [])

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/admin/settings/')
      setAppSettings(data)
    } catch (e) { console.error("Error settings:", e) }
  }, [])

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/admin/notifications/')
      setNotifications(data)
    } catch (e) { console.error("Error notifications:", e) }
  }, [])

  const fetchActivityLogs = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/admin/activity-logs/', {
        params: { search: logSearch, severity: logSeverityFilter !== 'all' ? logSeverityFilter : undefined }
      })
      setActivityLogs(data)
    } catch (e) { console.error("Error activity logs:", e) }
  }, [logSearch, logSeverityFilter])

  const fetchRoles = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/admin/roles/')
      setRolesList(data)
    } catch (e) { console.error("Error roles:", e) }
  }, [])

  const fetchPermissions = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/admin/permissions/')
      setPermissionsList(data)
    } catch (e) { console.error("Error permissions:", e) }
  }, [])

  const loadAllData = useCallback(async () => {
    setLoading(true)
    await Promise.all([
      fetchStats(),
      fetchDbInfo(),
      fetchSysHealth(),
      fetchUsers(),
      fetchSkills(),
      fetchTasks(),
      fetchFeedback(),
      fetchEmailLogs(),
      fetchBackups(),
      fetchSettings(),
      fetchNotifications(),
      fetchActivityLogs(),
      fetchRoles(),
      fetchPermissions()
    ])
    setLoading(false)
  }, [
    fetchStats, fetchDbInfo, fetchSysHealth, fetchUsers, fetchSkills, fetchTasks,
    fetchFeedback, fetchEmailLogs, fetchBackups, fetchSettings, fetchNotifications,
    fetchActivityLogs, fetchRoles, fetchPermissions
  ])

  useEffect(() => {
    loadAllData()
  }, [])

  // Keyboard shortcut Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setGlobalSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Actions
  const handleToggleUserStatus = async (userId) => {
    try {
      await apiClient.post(`/admin/users/${userId}/toggle_status/`)
      await fetchUsers()
      await fetchStats()
      await fetchActivityLogs()
    } catch (e) { alert("Failed to toggle status") }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!userResetPassVal || userResetPassVal.length < 6) {
      alert("Password must be at least 6 characters.")
      return
    }
    try {
      await apiClient.post(`/admin/users/${selectedUserDetail.id}/reset_password/`, { password: userResetPassVal })
      alert("Password has been reset.")
      setUserResetPassOpen(false)
      setUserResetPassVal('')
      await fetchActivityLogs()
    } catch (e) { alert("Failed to reset password") }
  }

  const handleSaveUser = async (e) => {
    e.preventDefault()
    try {
      if (selectedUserDetail) {
        await apiClient.put(`/admin/users/${selectedUserDetail.id}/`, userForm)
      } else {
        await apiClient.post('/admin/users/', userForm)
      }
      setUserEditModalOpen(false)
      setUserForm({ username: '', email: '', password: '', full_name: '', is_staff: false })
      await fetchUsers()
      await fetchStats()
      await fetchActivityLogs()
    } catch (e) {
      alert("Error saving user details: " + JSON.stringify(e.response?.data || "Server error"))
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure?")) return
    try {
      await apiClient.delete(`/admin/users/${userId}/`)
      await fetchUsers()
      await fetchStats()
      await fetchActivityLogs()
    } catch (e) { alert("Failed to delete user") }
  }

  const viewUserHistory = async (user) => {
    try {
      const { data } = await apiClient.get(`/admin/users/${user.id}/login_history/`)
      setUserHistory(data)
      setSelectedUserDetail(user)
      setUserHistoryModalOpen(true)
    } catch (e) { alert("Failed to load user history") }
  }

  // Skills
  const handleSaveSkill = async (e) => {
    e.preventDefault()
    try {
      if (selectedEditSkill) {
        await apiClient.put(`/admin/skills/${selectedEditSkill.id}/`, skillForm)
      } else {
        const me = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null
        await apiClient.post('/admin/skills/', { ...skillForm, user: me?.id })
      }
      setSkillFormOpen(false)
      setSkillForm({ name: '', color: '#8B5CF6', target_tasks: 10 })
      await fetchSkills()
      await fetchStats()
      await fetchActivityLogs()
    } catch (e) { alert("Failed to save skill") }
  }

  const handleDeleteSkill = async (skillId) => {
    if (!confirm("Delete skill?")) return
    try {
      await apiClient.delete(`/admin/skills/${skillId}/`)
      await fetchSkills()
      await fetchStats()
      await fetchActivityLogs()
    } catch (e) { alert("Failed to delete skill") }
  }

  // Tasks
  const handleSaveTask = async (e) => {
    e.preventDefault()
    try {
      if (selectedEditTask) {
        await apiClient.put(`/admin/tasks/${selectedEditTask.id}/`, taskForm)
      } else {
        const me = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null
        await apiClient.post('/admin/tasks/', { ...taskForm, user: me?.id })
      }
      setTaskFormOpen(false)
      setTaskForm({ title: '', description: '', status: 'pending', skill: '' })
      await fetchTasks()
      await fetchStats()
      await fetchActivityLogs()
    } catch (e) { alert("Failed to save task") }
  }

  const handleUpdateTaskStatus = async (task, statusVal) => {
    try {
      await apiClient.put(`/admin/tasks/${task.id}/`, {
        title: task.title,
        description: task.description,
        status: statusVal,
        skill: task.skill
      })
      await fetchTasks()
      await fetchStats()
      await fetchActivityLogs()
    } catch (e) { alert("Failed to modify status value") }
  }

  const handleDeleteTask = async (taskId) => {
    if (!confirm("Delete task?")) return
    try {
      await apiClient.delete(`/admin/tasks/${taskId}/`)
      await fetchTasks()
      await fetchStats()
      await fetchActivityLogs()
    } catch (e) { alert("Failed to delete task") }
  }

  // Feedback resolves
  const handleResolveFb = async (e) => {
    e.preventDefault()
    try {
      await apiClient.post(`/admin/feedback/${selectedFb.id}/resolve/`, { reply: fbReplyText })
      setFbReplyOpen(false)
      setFbReplyText('')
      await fetchFeedback()
      await fetchStats()
      await fetchActivityLogs()
    } catch (e) { alert("Failed to resolve ticket") }
  }

  const handleDeleteFb = async (fbId) => {
    if (!confirm("Delete feedback ticket?")) return
    try {
      await apiClient.delete(`/admin/feedback/${fbId}/`)
      await fetchFeedback()
      await fetchStats()
      await fetchActivityLogs()
    } catch (e) { alert("Failed to delete feedback") }
  }

  // Email Logs
  const handleRetryEmail = async (emailId) => {
    try {
      await apiClient.post(`/admin/emails/${emailId}/retry/`)
      alert("Email resent successfully.")
      await fetchEmailLogs()
      await fetchStats()
      await fetchActivityLogs()
    } catch (e) { alert("Failed to retry email send") }
  }

  // Backups
  const triggerBackup = async () => {
    try {
      await apiClient.post('/admin/backups/create_backup/')
      alert("Database snapshot created successfully.")
      await fetchBackups()
      await fetchActivityLogs()
    } catch (e) { alert("Failed to create backup") }
  }

  const handleRestore = async (backupId) => {
    if (!confirm("Caution: Overwrite database?")) return
    try {
      await apiClient.post(`/admin/backups/${backupId}/restore/`)
      alert("Database restored successfully.")
      await loadAllData()
    } catch (e) { alert("Restore failed") }
  }

  // Settings
  const handleSettingsUpdate = async (e) => {
    e.preventDefault()
    try {
      await apiClient.post('/admin/settings/', { settings: appSettings })
      alert("Settings updated.")
      await fetchSettings()
      await fetchActivityLogs()
    } catch (e) { alert("Failed to save configurations") }
  }

  // Notifications
  const handleSendNotif = async (e) => {
    e.preventDefault()
    try {
      await apiClient.post('/admin/notifications/broadcast/', notifForm)
      alert("Alert sent successfully.")
      setNotifForm({ title: '', message: '', recipient: '', scheduled_for: '' })
      await fetchNotifications()
      await fetchActivityLogs()
    } catch (e) { alert("Failed to send notification") }
  }

  // Roles CRUD
  const handleSaveRole = async (e) => {
    e.preventDefault()
    try {
      if (selectedEditRole) {
        await apiClient.put(`/admin/roles/${selectedEditRole.id}/`, roleForm)
      } else {
        await apiClient.post('/admin/roles/', roleForm)
      }
      setRoleFormOpen(false)
      setRoleForm({ name: '', permissions: [] })
      await fetchRoles()
      await fetchActivityLogs()
    } catch (e) { alert("Failed to save role") }
  }

  const handleDeleteRole = async (roleId) => {
    if (!confirm("Delete group role?")) return
    try {
      await apiClient.delete(`/admin/roles/${roleId}/`)
      await fetchRoles()
      await fetchActivityLogs()
    } catch (e) { alert("Failed to delete role") }
  }

  const handleExport = (type) => {
    const apiBase = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'
    window.open(`${apiBase}/admin/reports/?type=${type}`, '_blank')
  }

  // Search filter lists
  const filteredSearchItems = useMemo(() => {
    if (!globalSearchQuery) return []
    const q = globalSearchQuery.toLowerCase()
    const results = []

    usersList.forEach(u => {
      if (u.email?.toLowerCase().includes(q) || u.profile?.full_name?.toLowerCase().includes(q)) {
        results.push({ type: 'User', title: u.profile?.full_name || u.username, subtitle: u.email, tab: 'users' })
      }
    })

    skillsList.forEach(s => {
      if (s.name?.toLowerCase().includes(q)) {
        results.push({ type: 'Skill', title: s.name, subtitle: `Target: ${s.target_tasks} tasks`, tab: 'skills' })
      }
    })

    tasksList.forEach(t => {
      if (t.title?.toLowerCase().includes(q)) {
        results.push({ type: 'Task', title: t.title, subtitle: `Skill: ${t.skill_name}`, tab: 'tasks' })
      }
    })

    feedbackList.forEach(f => {
      if (f.message?.toLowerCase().includes(q) || f.name?.toLowerCase().includes(q)) {
        results.push({ type: 'Feedback', title: `Feedback from ${f.name || 'Anon'}`, subtitle: f.message, tab: 'feedback' })
      }
    })

    return results.slice(0, 8)
  }, [globalSearchQuery, usersList, skillsList, tasksList, feedbackList])

  // Heatmap calculations
  const streakHeatmap = useMemo(() => {
    if (stats?.charts?.streak_heatmap) {
      return stats.charts.streak_heatmap
    }
    const days = []
    const base = new Date()
    for (let i = 59; i >= 0; i--) {
      const d = new Date()
      d.setDate(base.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      days.push({ date: dateStr, count: 0 })
    }
    return days
  }, [stats])

  return (
    <div className={`min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans overflow-x-hidden ${darkMode ? 'dark' : ''}`}>
      
      {/* Global Search Modal */}
      <AnimatePresence>
        {globalSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-slate-950/80 backdrop-blur-md">
            <div className="w-full max-w-lg bg-[#111827] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5">
                <Search size={18} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Global Search (Ctrl+K)..."
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  className="bg-transparent border-none text-slate-100 text-sm outline-none w-full"
                  autoFocus
                />
                <button onClick={() => setGlobalSearchOpen(false)} className="text-xs text-slate-400 border border-white/10 px-2 py-0.5 rounded">ESC</button>
              </div>
              <div className="p-2 max-h-80 overflow-y-auto space-y-1">
                {filteredSearchItems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveTab(item.tab)
                      setGlobalSearchOpen(false)
                      setGlobalSearchQuery('')
                    }}
                    className="w-full flex items-center justify-between p-2.5 hover:bg-white/[0.03] rounded-xl text-left transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{item.title}</p>
                      <p className="text-[10px] text-slate-450 truncate max-w-xs">{item.subtitle}</p>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/25 text-purple-400">{item.type}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 relative">
        {/* Left Sidebar Layout */}
        <aside className={`w-[260px] border-r border-white/5 bg-[#0c101b] flex flex-col justify-between flex-shrink-0 z-30 transition-all duration-350 md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0 fixed inset-y-0 left-0 shadow-2xl' : '-translate-x-full absolute md:relative'
        }`}>
          <div>
            <div className="px-6 py-5 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <img src="/static/email/logo.png" alt="Progressly" className="h-8 w-auto object-contain" />
                <span className="font-extrabold text-white text-base tracking-tight">Progressly</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <nav className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
              <div className="space-y-1.5">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider px-3">Management</p>
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: <Layout size={14} /> },
                  { id: 'users', label: 'Users', icon: <UsersIcon size={14} /> },
                  { id: 'skills', label: 'Skills', icon: <Brain size={14} /> },
                  { id: 'tasks', label: 'Tasks', icon: <ClipboardList size={14} /> },
                  { id: 'streaks', label: 'Streaks', icon: <Flame size={14} /> },
                  { id: 'feedback', label: 'Feedback', icon: <MessageSquare size={14} /> },
                  { id: 'emails', label: 'Email Logs', icon: <Mail size={14} /> },
                  { id: 'notifications', label: 'Notifications', icon: <Bell size={14} /> }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id)
                      setIsMobileMenuOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer relative ${
                      activeTab === item.id
                        ? 'bg-purple-500/10 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02] border border-transparent'
                    }`}
                  >
                    {activeTab === item.id && (
                      <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-md bg-purple-500" />
                    )}
                    <span className={activeTab === item.id ? 'text-purple-400' : 'text-slate-500'}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider px-3">Analytics</p>
                {[
                  { id: 'analytics', label: 'Analytics', icon: <TrendingUp size={14} /> },
                  { id: 'reports', label: 'Reports', icon: <SlidersIcon /> }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id)
                      setIsMobileMenuOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer relative ${
                      activeTab === item.id
                        ? 'bg-purple-500/10 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02] border border-transparent'
                    }`}
                  >
                    {activeTab === item.id && (
                      <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-md bg-purple-500" />
                    )}
                    <span className={activeTab === item.id ? 'text-purple-400' : 'text-slate-500'}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider px-3">System</p>
                {[
                  { id: 'database', label: 'Database', icon: <DatabaseIcon size={14} /> },
                  { id: 'health', label: 'System Health', icon: <Activity size={14} /> },
                  { id: 'backup', label: 'Backup', icon: <RefreshCw size={14} /> },
                  { id: 'settings', label: 'Settings', icon: <SettingsIcon size={14} /> },
                  { id: 'logs', label: 'Activity Logs', icon: <List size={14} /> },
                  { id: 'roles', label: 'Roles & Permissions', icon: <Shield size={14} /> }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id)
                      setIsMobileMenuOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer relative ${
                      activeTab === item.id
                        ? 'bg-purple-500/10 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02] border border-transparent'
                    }`}
                  >
                    {activeTab === item.id && (
                      <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-md bg-purple-500" />
                    )}
                    <span className={activeTab === item.id ? 'text-purple-400' : 'text-slate-500'}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </nav>
          </div>

          <div className="p-4 border-t border-white/5 bg-white/[0.01] flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/25 flex items-center justify-center font-black text-purple-400 text-xs flex-shrink-0">
                {authUser?.profile?.full_name?.charAt(0) || authUser?.username?.charAt(0) || 'AD'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{authUser?.profile?.full_name || authUser?.username || 'Admin'}</p>
                <p className="text-[9px] text-slate-500 font-semibold uppercase truncate">
                  {authUser?.is_superuser ? 'Super Admin' : 'Staff Admin'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-rose-500/10 hover:border-rose-500/25 text-slate-400 hover:text-rose-400 cursor-pointer transition-all flex-shrink-0"
              title="Sign Out"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </aside>

        {/* Main Panel Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b border-white/5 bg-slate-950/20 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-slate-400 hover:text-white cursor-pointer">
                <Menu size={18} />
              </button>
              <h2 className="text-sm font-bold text-white capitalize">{activeTab === 'health' ? 'System Health' : activeTab === 'logs' ? 'Activity Logs' : activeTab === 'roles' ? 'Roles & Permissions' : activeTab === 'emails' ? 'Email Logs' : activeTab}</h2>
            </div>
            
            <div className="flex items-center gap-4">
              <div
                onClick={() => setGlobalSearchOpen(true)}
                className="hidden sm:flex items-center gap-2 bg-[#111827]/60 border border-white/5 hover:border-purple-500/20 px-3.5 py-1.5 rounded-xl cursor-pointer text-slate-400 text-xs w-44 transition-all"
              >
                <Search size={13} />
                <span>Search anything...</span>
                <span className="ml-auto text-[8px] bg-white/5 border border-white/10 px-1 py-0.5 rounded text-slate-500 font-bold">Ctrl+K</span>
              </div>

              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-slate-355 cursor-pointer transition-all"
              >
                {darkMode ? <Sun size={14} /> : <Moon size={14} />}
              </button>

              <button className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-slate-355 cursor-pointer relative transition-all">
                <Bell size={14} />
                <span className="w-1.5 h-1.5 rounded-full bg-purple-555 absolute top-1 right-1 border border-[#070B14]" />
              </button>

              <div
                onClick={handleLogout}
                className="flex items-center gap-3 border-l border-white/5 pl-4 cursor-pointer hover:opacity-80 transition-all"
                title="Click to Sign Out"
              >
                <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/25 flex items-center justify-center font-bold text-purple-400 text-xs">
                  {authUser?.profile?.full_name?.charAt(0) || authUser?.username?.charAt(0) || 'AD'}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-bold text-white leading-none">{authUser?.profile?.full_name || authUser?.username || 'Admin'}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">{authUser?.is_superuser ? 'Super Admin' : 'Staff Admin'}</p>
                </div>
              </div>
            </div>
          </header>

          <div className="p-6 overflow-y-auto max-w-7xl w-full mx-auto flex-1">
            {loading ? (
              <SkeletonLoader />
            ) : (
              <AnimatePresence mode="wait">
                
                {activeTab === 'dashboard' && stats && (
                  <Dashboard
                    stats={stats}
                    dbInfo={dbInfo}
                    sysHealth={sysHealth}
                    usersList={usersList}
                    skillsList={skillsList}
                    activityLogs={activityLogs}
                    handleExport={handleExport}
                    setActiveTab={setActiveTab}
                  />
                )}

                {activeTab === 'users' && (
                  <Users usersList={usersList} userSearch={userSearch} setUserSearch={setUserSearch} viewUserHistory={viewUserHistory} handleToggleUserStatus={handleToggleUserStatus} setSelectedUserDetail={setSelectedUserDetail} setUserResetPassOpen={setUserResetPassOpen} setUserForm={setUserForm} setUserEditModalOpen={setUserEditModalOpen} handleDeleteUser={handleDeleteUser} />
                )}

                {activeTab === 'skills' && (
                  <Skills skillsList={skillsList} setSelectedEditSkill={setSelectedEditSkill} setSkillForm={setSkillForm} setSkillFormOpen={setSkillFormOpen} handleDeleteSkill={handleDeleteSkill} />
                )}

                {activeTab === 'tasks' && (
                  <Tasks tasksList={tasksList} skillsList={skillsList} taskViewMode={taskViewMode} setTaskViewMode={setTaskViewMode} setSelectedEditTask={setSelectedEditTask} setTaskForm={setTaskForm} setTaskFormOpen={setTaskFormOpen} handleUpdateTaskStatus={handleUpdateTaskStatus} handleDeleteTask={handleDeleteTask} />
                )}

                {activeTab === 'streaks' && (
                  <Streaks streakHeatmap={streakHeatmap} />
                )}

                {activeTab === 'feedback' && (
                  <Feedback feedbackList={feedbackList} setSelectedFb={setSelectedFb} setFbReplyOpen={setFbReplyOpen} handleDeleteFb={handleDeleteFb} />
                )}

                {activeTab === 'emails' && (
                  <EmailLogs emailLogs={emailLogs} handleRetryEmail={handleRetryEmail} />
                )}

                {activeTab === 'notifications' && (
                  <Notifications notifications={notifications} notifForm={notifForm} setNotifForm={setNotifForm} handleSendNotif={handleSendNotif} />
                )}

                {activeTab === 'analytics' && stats && (
                  <Analytics stats={stats} />
                )}

                {activeTab === 'reports' && (
                  <Reports handleExport={handleExport} />
                )}

                {activeTab === 'database' && dbInfo && (
                  <Database dbInfo={dbInfo} />
                )}

                {activeTab === 'health' && sysHealth && (
                  <Health sysHealth={sysHealth} />
                )}

                {activeTab === 'backup' && (
                  <Backup backups={backups} triggerBackup={triggerBackup} handleRestore={handleRestore} />
                )}

                {activeTab === 'settings' && (
                  <Settings appSettings={appSettings} setAppSettings={setAppSettings} handleSettingsUpdate={handleSettingsUpdate} />
                )}

                {activeTab === 'logs' && (
                  <LogsView activityLogs={activityLogs} logSeverityFilter={logSeverityFilter} setLogSeverityFilter={setLogSeverityFilter} />
                )}

                {activeTab === 'roles' && (
                  <Roles rolesList={rolesList} permissionsList={permissionsList} setRoleForm={setRoleForm} setRoleFormOpen={setRoleFormOpen} setSelectedEditRole={setSelectedEditRole} handleDeleteRole={handleDeleteRole} />
                )}

              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* User Create/Edit Modal */}
      {userEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleSaveUser} className="bg-[#111827] border border-white/5 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">{selectedUserDetail ? 'Edit User Profile' : 'Create User'}</h3>
            <div className="space-y-1.5">
              <label className="text-[9px] text-slate-400 uppercase font-bold">Email Address</label>
              <input
                type="email"
                required
                placeholder="user@example.com"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value, username: e.target.value })}
                className="w-full bg-[#070B14] border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] text-slate-400 uppercase font-bold">Full Name</label>
              <input
                type="text"
                required
                placeholder="Full Name"
                value={userForm.full_name}
                onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                className="w-full bg-[#070B14] border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none"
              />
            </div>
            {!selectedUserDetail && (
              <div className="space-y-1.5">
                <label className="text-[9px] text-slate-400 uppercase font-bold">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 chars"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full bg-[#070B14] border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none"
                />
              </div>
            )}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="is_staff_modal"
                checked={userForm.is_staff}
                onChange={(e) => setUserForm({ ...userForm, is_staff: e.target.checked })}
              />
              <label htmlFor="is_staff_modal" className="text-xs text-slate-300 cursor-pointer">Grant Administrator Privileges</label>
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button type="button" onClick={() => setUserEditModalOpen(false)} className="px-4 py-2 bg-white/5 text-xs text-slate-300 rounded-xl hover:bg-white/10 transition-all cursor-pointer">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-purple-600 text-xs text-white rounded-xl hover:bg-purple-500 transition-all cursor-pointer">Save</button>
            </div>
          </form>
        </div>
      )}

      {/* Password Reset Modal */}
      {userResetPassOpen && selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleResetPassword} className="bg-[#111827] border border-white/5 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Reset Password</h3>
            <p className="text-xs text-slate-400">Reset credentials of user: {selectedUserDetail.email}</p>
            <div className="space-y-1">
              <label className="text-[9px] text-slate-400 uppercase font-bold">New Password</label>
              <input
                type="password"
                required
                placeholder="Min 6 characters"
                value={userResetPassVal}
                onChange={(e) => setUserResetPassVal(e.target.value)}
                className="w-full bg-[#070B14] border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button type="button" onClick={() => setUserResetPassOpen(false)} className="px-4 py-2 bg-white/5 text-xs text-slate-300 rounded-xl hover:bg-white/10 cursor-pointer transition-all">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-purple-600 text-xs text-white rounded-xl hover:bg-purple-500 cursor-pointer transition-all">Reset</button>
            </div>
          </form>
        </div>
      )}

      {/* Feedback Reply Resolve Modal */}
      {fbReplyOpen && selectedFb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleResolveFb} className="bg-[#111827] border border-white/5 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Resolve &amp; Reply Ticket</h3>
            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-xs space-y-1">
              <p className="font-bold text-purple-300">Message context:</p>
              <p className="italic text-slate-300">"{selectedFb.message}"</p>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-slate-400 uppercase font-bold">Reply Content</label>
              <textarea
                required
                placeholder="Type resolution message..."
                value={fbReplyText}
                onChange={(e) => setFbReplyText(e.target.value)}
                rows={4}
                className="w-full bg-[#070B14] border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button type="button" onClick={() => setFbReplyOpen(false)} className="px-4 py-2 bg-white/5 text-xs text-slate-300 rounded-xl hover:bg-white/10 cursor-pointer transition-all">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-purple-600 text-xs text-white rounded-xl hover:bg-purple-500 cursor-pointer transition-all">Submit Resolve</button>
            </div>
          </form>
        </div>
      )}

      {/* User Login History Modal */}
      {userHistoryModalOpen && selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-[#111827] border border-white/5 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h3 className="text-sm font-bold text-white">Sessions Audit Trail</h3>
              <button onClick={() => setUserHistoryModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={16} /></button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {userHistory.map((item) => (
                <div key={item.id} className="p-2.5 border border-white/5 rounded-xl bg-white/[0.01] text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-300">IP: {item.ip_address}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                      item.is_active_session ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-450'
                    }`}>{item.is_active_session ? 'Active' : 'Expired'}</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Logged in: {new Date(item.login_time).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Skill Modal Form */}
      {skillFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleSaveSkill} className="bg-[#111827] border border-white/5 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">{selectedEditSkill ? 'Edit Skill' : 'Create Skill'}</h3>
            <div className="space-y-1">
              <label className="text-[9px] text-slate-400 uppercase font-bold">Skill Name</label>
              <input
                type="text"
                required
                placeholder="Python, React..."
                value={skillForm.name}
                onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
                className="w-full bg-[#070B14] border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-slate-400 uppercase font-bold">Target Tasks Quota</label>
              <input
                type="number"
                required
                min={1}
                value={skillForm.target_tasks}
                onChange={(e) => setSkillForm({ ...skillForm, target_tasks: parseInt(e.target.value, 10) })}
                className="w-full bg-[#070B14] border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-slate-400 uppercase font-bold">Theme Color</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={skillForm.color}
                  onChange={(e) => setSkillForm({ ...skillForm, color: e.target.value })}
                  className="w-8 h-8 rounded-full border border-white/5 bg-transparent cursor-pointer"
                />
                <span className="text-xs text-slate-300 font-mono uppercase">{skillForm.color}</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button type="button" onClick={() => setSkillFormOpen(false)} className="px-4 py-2 bg-white/5 text-xs text-slate-300 rounded-xl hover:bg-white/10 cursor-pointer transition-all">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-purple-600 text-xs text-white rounded-xl hover:bg-purple-500 cursor-pointer transition-all">Save</button>
            </div>
          </form>
        </div>
      )}

      {/* Task Modal Form */}
      {taskFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleSaveTask} className="bg-[#111827] border border-white/5 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">{selectedEditTask ? 'Edit Task' : 'Create Task'}</h3>
            <div className="space-y-1">
              <label className="text-[9px] text-slate-400 uppercase font-bold">Task Title</label>
              <input
                type="text"
                required
                placeholder="Learn Object-Oriented Principles..."
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                className="w-full bg-[#070B14] border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-slate-400 uppercase font-bold">Associated Skill</label>
              <select
                required
                value={taskForm.skill}
                onChange={(e) => setTaskForm({ ...taskForm, skill: e.target.value })}
                className="w-full bg-[#070B14] border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none"
              >
                <option value="">Select a skill...</option>
                {skillsList.map((skill) => (
                  <option key={skill.id} value={skill.id}>{skill.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-slate-400 uppercase font-bold">Status</label>
              <select
                required
                value={taskForm.status}
                onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                className="w-full bg-[#070B14] border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button type="button" onClick={() => setTaskFormOpen(false)} className="px-4 py-2 bg-white/5 text-xs text-slate-300 rounded-xl hover:bg-white/10 cursor-pointer transition-all">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-purple-600 text-xs text-white rounded-xl hover:bg-purple-500 cursor-pointer transition-all">Save</button>
            </div>
          </form>
        </div>
      )}

      {/* Role Create/Edit Modal */}
      {roleFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleSaveRole} className="bg-[#111827] border border-white/5 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">{selectedEditRole ? 'Edit Role Permissions' : 'Create Custom Role'}</h3>
            <div className="space-y-1">
              <label className="text-[9px] text-slate-400 uppercase font-bold">Role Name</label>
              <input
                type="text"
                required
                placeholder="Manager, Moderator..."
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                className="w-full bg-[#070B14] border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-slate-400 uppercase font-bold">Assign Permissions ({roleForm.permissions.length} active)</label>
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto p-2 border border-white/5 rounded-xl bg-[#070B14]/40">
                {permissionsList.map((p) => {
                  const isChecked = roleForm.permissions.includes(p.id)
                  return (
                    <div key={p.id} className="flex items-center gap-2 text-[11px] p-1">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRoleForm({ ...roleForm, permissions: [...roleForm.permissions, p.id] })
                          } else {
                            setRoleForm({ ...roleForm, permissions: roleForm.permissions.filter(id => id !== p.id) })
                          }
                        }}
                      />
                      <span className="text-slate-300 font-medium truncate" title={p.name}>{p.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button type="button" onClick={() => setRoleFormOpen(false)} className="px-4 py-2 bg-white/5 text-xs text-slate-300 rounded-xl hover:bg-white/10 cursor-pointer transition-all">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-purple-600 text-xs text-white rounded-xl hover:bg-purple-500 cursor-pointer transition-all">Save Role</button>
            </div>
          </form>
        </div>
      )}

    </div>
  )
}

function SlidersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  )
}
