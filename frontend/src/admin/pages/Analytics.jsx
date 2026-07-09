import React, { useState, useEffect, useCallback } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { TrendingUp, Users, CheckSquare, Brain, Trophy, Mail, AlertCircle, RefreshCw, Medal, Loader2 } from 'lucide-react'
import { adminAnalyticsService } from '../services/analyticsService'
import './Analytics.css'

const TIMEFRAMES = [
  { label: '7D', value: 7 },
  { label: '30D', value: 30 },
  { label: '90D', value: 90 },
  { label: '1Y', value: 365 },
]

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className={`analytics-stat-card analytics-stat-card--${color}`}>
    <div className="analytics-stat-card__icon">
      <Icon size={20} strokeWidth={2} />
    </div>
    <div className="analytics-stat-card__body">
      <span className="analytics-stat-card__value">{value ?? '—'}</span>
      <span className="analytics-stat-card__label">{label}</span>
      {sub && <span className="analytics-stat-card__sub">{sub}</span>}
    </div>
  </div>
)

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="analytics-tooltip">
      <div className="analytics-tooltip__label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="analytics-tooltip__row" style={{ color: p.color }}>
          <span>{p.name}:</span>
          <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  )
}

const RANK_ICONS = ['🥇', '🥈', '🥉']

export default function Analytics() {
  const [data, setData] = useState(null)
  const [timeframe, setTimeframe] = useState(30)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await adminAnalyticsService.getAnalytics(timeframe)
      setData(result)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load analytics.')
    } finally {
      setIsLoading(false)
    }
  }, [timeframe])

  useEffect(() => { fetchData() }, [fetchData])

  const stats = data?.stats || {}
  const growthChart = data?.growth_chart || []
  const skillDist = data?.skill_distribution || []
  const topLearners = data?.top_learners || []

  return (
    <div className="analytics-page">
      {/* Header */}
      <div className="analytics-header">
        <div className="analytics-header__left">
          <div className="analytics-header__icon-wrap">
            <TrendingUp size={22} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="analytics-header__title">Analytics</h1>
            <p className="analytics-header__subtitle">Deep platform insights &amp; performance metrics</p>
          </div>
        </div>
        <div className="analytics-header__controls">
          <div className="analytics-timeframe-pills">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.value}
                className={`analytics-pill${timeframe === tf.value ? ' analytics-pill--active' : ''}`}
                onClick={() => setTimeframe(tf.value)}
                id={`analytics-tf-${tf.value}`}
              >
                {tf.label}
              </button>
            ))}
          </div>
          <button className="analytics-refresh-btn" onClick={fetchData} disabled={isLoading} id="analytics-refresh-btn">
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="analytics-error">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={fetchData}>Retry</button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="analytics-stats-grid">
        <StatCard icon={Users} label="Total Users" value={stats.total_users?.toLocaleString()} sub={`${stats.new_users ?? 0} new this period`} color="purple" />
        <StatCard icon={Users} label="Active Users" value={stats.active_users?.toLocaleString()} color="blue" />
        <StatCard icon={CheckSquare} label="Tasks Completed" value={stats.completed_tasks?.toLocaleString()} sub={`${stats.completion_rate ?? 0}% rate`} color="green" />
        <StatCard icon={Brain} label="Total Skills" value={stats.total_skills?.toLocaleString()} color="indigo" />
        <StatCard icon={Trophy} label="Achievements Unlocked" value={stats.total_unlocked?.toLocaleString()} sub={`of ${stats.total_achievements ?? 0} total`} color="yellow" />
        <StatCard icon={Mail} label="Emails Sent" value={stats.emails_sent?.toLocaleString()} sub={`${stats.emails_failed ?? 0} failed`} color="teal" />
      </div>

      {/* Charts Row */}
      <div className="analytics-charts-row">
        {/* User Growth + Tasks Completed Area Chart */}
        <div className="analytics-chart-card admin-glow-card">
          <div className="analytics-chart-card__header">
            <h3>User Growth &amp; Task Completions</h3>
            <span className="analytics-chart-card__sub">Last {Math.min(timeframe, 30)} days</span>
          </div>
          {isLoading ? (
            <div className="analytics-chart-loading"><Loader2 size={24} className="spin" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={growthChart} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="ag-users" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ag-tasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="new_users" name="New Users" stroke="#7c3aed" fill="url(#ag-users)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="tasks_completed" name="Tasks Completed" stroke="#10b981" fill="url(#ag-tasks)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Skill Distribution Bar Chart */}
        <div className="analytics-chart-card admin-glow-card">
          <div className="analytics-chart-card__header">
            <h3>Skill Distribution</h3>
            <span className="analytics-chart-card__sub">By learner count</span>
          </div>
          {isLoading ? (
            <div className="analytics-chart-loading"><Loader2 size={24} className="spin" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={skillDist} margin={{ top: 8, right: 16, left: 0, bottom: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} angle={-25} textAnchor="end" />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Learners" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Learners Leaderboard */}
      <div className="analytics-leaderboard admin-glow-card">
        <div className="analytics-leaderboard__header">
          <Medal size={18} />
          <h3>Top Learners Leaderboard</h3>
          <span className="analytics-leaderboard__badge">By Completed Tasks</span>
        </div>
        {isLoading ? (
          <div className="analytics-chart-loading"><Loader2 size={24} className="spin" /></div>
        ) : topLearners.length === 0 ? (
          <div className="analytics-empty">No task completions recorded yet.</div>
        ) : (
          <div className="analytics-leaderboard__table">
            <div className="analytics-leaderboard__head">
              <span>#</span>
              <span>User</span>
              <span>Completed Tasks</span>
            </div>
            {topLearners.map((l, i) => (
              <div key={l.user_id} className={`analytics-leaderboard__row${i < 3 ? ' analytics-leaderboard__row--top' : ''}`}>
                <span className="analytics-leaderboard__rank">
                  {i < 3 ? RANK_ICONS[i] : `#${i + 1}`}
                </span>
                <div className="analytics-leaderboard__user">
                  <div className="analytics-leaderboard__avatar">
                    {(l.full_name || l.username)[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="analytics-leaderboard__name">{l.full_name || l.username}</div>
                    <div className="analytics-leaderboard__username">@{l.username}</div>
                  </div>
                </div>
                <div className="analytics-leaderboard__count">
                  <span className="analytics-leaderboard__badge-count">{l.completed_tasks}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
