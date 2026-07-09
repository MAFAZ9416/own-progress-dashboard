import React, { useState, useEffect, useCallback } from 'react'
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'
import { 
  FileText, 
  Calendar, 
  Download, 
  TrendingUp, 
  Users, 
  Brain, 
  ClipboardList, 
  AlertCircle,
  Activity
} from 'lucide-react'
import { adminReportsService } from '../services/reportsService'
import './Reports.css'

export default function Reports() {
  // Data state
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeframe, setTimeframe] = useState('30') // '7', '30', '365'

  // Fetch report data
  const fetchReportData = useCallback(async (isInitial = true) => {
    if (isInitial) setIsLoading(true)
    setError(null)
    try {
      const result = await adminReportsService.getReportsAnalytics({ timeframe })
      setData(result)
    } catch (err) {
      console.error('Error fetching report analytics:', err)
      setError('Failed to fetch analytics report data.')
    } finally {
      setIsLoading(false)
    }
  }, [timeframe])

  useEffect(() => {
    fetchReportData(true)
  }, [timeframe, fetchReportData])

  // CSV Export utility (only exports aggregated date-count info)
  const exportToCSV = (dataset, filename, headers) => {
    if (!dataset || dataset.length === 0) {
      alert('No data available to export.')
      return
    }

    let csvContent = "data:text/csv;charset=utf-8,"
    csvContent += headers.join(",") + "\n"

    dataset.forEach(row => {
      const line = Object.values(row).join(",")
      csvContent += line + "\n"
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${filename}_${timeframe}d.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Calculate percentages
  const taskProgressPct = data?.totals
    ? Math.round((data.totals.completed_tasks / Math.max(data.totals.total_tasks, 1)) * 100)
    : 0

  return (
    <div className="admin-reports-container">
      {/* Header section */}
      <div className="admin-reports-header">
        <div className="header-left">
          <div className="header-icon-wrapper">
            <FileText className="header-icon" />
          </div>
          <div>
            <h1 className="admin-reports-title">Reports & Analytics</h1>
            <p className="admin-reports-subtitle">System telemetry metrics, growth charts, and analytical reports</p>
          </div>
        </div>

        <div className="timeframe-selector admin-glow-card">
          <Calendar className="cal-icon" />
          <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="365">Last 1 Year</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="admin-reports-error-alert">
          <AlertCircle className="error-alert-icon" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="admin-reports-loading">
          <div className="spinner"></div>
          <p>Compiling database analytics...</p>
        </div>
      ) : !data ? (
        <div className="admin-reports-empty-state">
          <FileText className="empty-icon" />
          <p>No report analytics dataset loaded.</p>
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="admin-reports-stats-grid">
            <div className="admin-reports-stat-card admin-glow-card">
              <div className="stat-icon-wrapper purple">
                <Users className="stat-icon" />
              </div>
              <div className="stat-content">
                <span className="stat-label">Total Registrations</span>
                <span className="stat-value">{data.totals?.total_users}</span>
              </div>
            </div>

            <div className="admin-reports-stat-card admin-glow-card">
              <div className="stat-icon-wrapper blue">
                <Activity className="stat-icon" />
              </div>
              <div className="stat-content">
                <span className="stat-label">Active Users</span>
                <span className="stat-value text-blue">{data.totals?.active_users}</span>
              </div>
            </div>

            <div className="admin-reports-stat-card admin-glow-card">
              <div className="stat-icon-wrapper green">
                <Brain className="stat-icon" />
              </div>
              <div className="stat-content">
                <span className="stat-label">Skills Managed</span>
                <span className="stat-value text-success">{data.totals?.total_skills}</span>
              </div>
            </div>

            <div className="admin-reports-stat-card admin-glow-card">
              <div className="stat-icon-wrapper amber">
                <ClipboardList className="stat-icon" />
              </div>
              <div className="stat-content">
                <span className="stat-label">Task Completion Rate</span>
                <span className="stat-value text-warning">{taskProgressPct}%</span>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${taskProgressPct}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts area */}
          <div className="charts-grid-container">
            {/* Chart 1: User growth */}
            <div className="chart-card admin-glow-card">
              <div className="chart-card-header">
                <h3>User Growth Trajectory</h3>
                <button 
                  onClick={() => exportToCSV(data.user_growth, "user_growth", ["Date", "UserCount"])}
                  className="export-btn"
                  title="Export to CSV"
                >
                  <Download className="export-btn-icon" />
                  CSV
                </button>
              </div>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={data.user_growth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.05)" />
                    <XAxis dataKey="date" stroke="#5e6b7e" fontSize={11} />
                    <YAxis stroke="#5e6b7e" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f1021', borderColor: 'rgba(99,102,241,0.15)', color: '#ffffff' }} />
                    <Area type="monotone" dataKey="users" stroke="#7c3aed" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" name="Users" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Active Users */}
            <div className="chart-card admin-glow-card">
              <div className="chart-card-header">
                <h3>Active Engagement</h3>
                <button 
                  onClick={() => exportToCSV(data.active_users, "active_users", ["Date", "ActiveUserCount"])}
                  className="export-btn"
                  title="Export to CSV"
                >
                  <Download className="export-btn-icon" />
                  CSV
                </button>
              </div>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={data.active_users} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.05)" />
                    <XAxis dataKey="date" stroke="#5e6b7e" fontSize={11} />
                    <YAxis stroke="#5e6b7e" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f1021', borderColor: 'rgba(99,102,241,0.15)', color: '#ffffff' }} />
                    <Line type="monotone" dataKey="active" stroke="#3b82f6" strokeWidth={2.5} activeDot={{ r: 6 }} name="Active Sessions" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Tasks Completed */}
            <div className="chart-card admin-glow-card">
              <div className="chart-card-header">
                <h3>Daily Completed Tasks</h3>
                <button 
                  onClick={() => exportToCSV(data.task_completion, "task_completions", ["Date", "CompletedTasks"])}
                  className="export-btn"
                  title="Export to CSV"
                >
                  <Download className="export-btn-icon" />
                  CSV
                </button>
              </div>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.task_completion} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.05)" />
                    <XAxis dataKey="date" stroke="#5e6b7e" fontSize={11} />
                    <YAxis stroke="#5e6b7e" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f1021', borderColor: 'rgba(99,102,241,0.15)', color: '#ffffff' }} />
                    <Bar dataKey="tasks" fill="#10b981" radius={[4, 4, 0, 0]} name="Tasks Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Skills created */}
            <div className="chart-card admin-glow-card">
              <div className="chart-card-header">
                <h3>Daily Skill Creations</h3>
                <button 
                  onClick={() => exportToCSV(data.skill_creation, "skills_created", ["Date", "SkillsCreated"])}
                  className="export-btn"
                  title="Export to CSV"
                >
                  <Download className="export-btn-icon" />
                  CSV
                </button>
              </div>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.skill_creation} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.05)" />
                    <XAxis dataKey="date" stroke="#5e6b7e" fontSize={11} />
                    <YAxis stroke="#5e6b7e" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f1021', borderColor: 'rgba(99,102,241,0.15)', color: '#ffffff' }} />
                    <Bar dataKey="skills" fill="#fbbf24" radius={[4, 4, 0, 0]} name="Skills Created" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
