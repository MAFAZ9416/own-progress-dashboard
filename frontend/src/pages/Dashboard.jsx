import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useDashboard } from '../hooks/useDashboard'
import { useMediaQuery } from '../hooks/useMediaQuery'
import StatCard from '../components/dashboard/StatCard'
import WeeklyProgressChart  from '../components/dashboard/WeeklyProgressChart'
import MonthlyProgressChart from '../components/dashboard/MonthlyProgressChart'
import LearningHeatmap      from '../components/dashboard/LearningHeatmap'
import SkeletonCard, { SkeletonText, SkeletonBlock } from '../components/common/SkeletonCard'
import { Brain, ClipboardList, Flame, Trophy, AlertCircle, CalendarDays, ChevronRight, Plus, X } from 'lucide-react'

/* ─── Constants ─────────────────────────────────────────────────────────── */
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Map activity type → coloured dot */
const TYPE_DOT = {
  skill:  '#7c3aed',
  task:   '#3b82f6',
  streak: '#f59e0b',
}

/** Map priority label → hex colour */
const PRIORITY_DOT = {
  high:   '#f87171',
  medium: '#fb923c',
  low:    '#94a3b8',
  done:   '#4ade80',
}

/** Greeting + emoji based on current hour */
function getGreeting() {
  const h = new Date().getHours()
  if (h >= 5 && h < 12)  return { text: 'Good Morning',   emoji: '☀️' }
  if (h >= 12 && h < 17) return { text: 'Good Afternoon',  emoji: '🌤️' }
  return { text: 'Good Evening', emoji: '🌙' }
}

/* ─── Stat card definitions — values injected from API ─────────────────── */
function buildStats(summary) {
  return [
    {
      id: 'stat-total-skills',
      label: 'Total Skills',
      value: summary?.total_skills ?? 0,
      gradient: 'linear-gradient(135deg, #7c3aed, #6366f1)',
      trend: summary?.skills_change != null
        ? { value: `${summary.skills_change > 0 ? '+' : ''}${summary.skills_change}`, positive: summary.skills_change >= 0 }
        : undefined,
      icon: <Brain size={20} strokeWidth={1.8} />,
    },
    {
      id: 'stat-total-tasks',
      label: 'Total Tasks',
      value: summary?.total_tasks ?? 0,
      gradient: 'linear-gradient(135deg, #6366f1, #3b82f6)',
      trend: summary?.tasks_change != null
        ? { value: `${summary.tasks_change > 0 ? '+' : ''}${summary.tasks_change}`, positive: summary.tasks_change >= 0 }
        : undefined,
      icon: <ClipboardList size={20} strokeWidth={1.8} />,
    },
    {
      id: 'stat-current-streak',
      label: 'Current Streak',
      value: summary?.current_streak ?? 0,
      suffix: 'days',
      gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
      trend: summary?.current_streak_trend ? { value: summary.current_streak_trend, positive: (summary?.current_streak ?? 0) > 0 } : undefined,
      icon: <Flame size={20} strokeWidth={1.8} />,
    },
    {
      id: 'stat-longest-streak',
      label: 'Longest Streak',
      value: summary?.longest_streak ?? 0,
      suffix: 'days',
      gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
      trend: summary?.longest_streak_trend ? { value: summary.longest_streak_trend, positive: (summary?.longest_streak ?? 0) > 0 } : undefined,
      icon: <Trophy size={20} strokeWidth={1.8} />,
    },
  ]
}

/* ─── Error banner ──────────────────────────────────────────────────────── */
function ErrorBanner({ message, onRetry }) {
  return (
    <div className="dash-error" role="alert">
      <div className="dash-error__inner">
        <AlertCircle size={20} className="dash-error__icon text-red-400" />
        <div>
          <p className="dash-error__title">Failed to load dashboard</p>
          <p className="dash-error__msg">{message}</p>
        </div>
      </div>
      <button id="dash-retry-btn" className="dash-error__retry" onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}

/* ─── Skeleton layouts ──────────────────────────────────────────────────── */
function StatSkeletons() {
  return (
    <div className="dash-stat-grid">
      {[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}
    </div>
  )
}

function ActivitySkeleton() {
  return (
    <div className="skeleton-feed">
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} className="skeleton-feed__row">
          <div className="skeleton-feed__dot skeleton-shimmer" />
          <div className="skeleton-feed__lines">
            <SkeletonText width="80%" height="13px" />
            <SkeletonText width="30%" height="10px" />
          </div>
        </div>
      ))}
    </div>
  )
}

function TaskSkeleton() {
  return (
    <div className="skeleton-feed">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="skeleton-feed__row">
          <div className="skeleton-feed__dot skeleton-shimmer" style={{ borderRadius: '50%' }} />
          <SkeletonText width={`${60 + i * 8}%`} height="13px" />
        </div>
      ))}
    </div>
  )
}

/* ─── Main component ────────────────────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showActivityModal, setShowActivityModal] = useState(false)
  const {
    summary,
    weekly,
    monthly,
    monthlyYear,
    availableYears,
    changeMonthlyYear,
    recent,
    heatmap,
    tasks,
    pendingTasks,
    skills,
    topSkills,
    isLoading,
    error,
    refetch,
  } = useDashboard()

  const isMobile = useMediaQuery('(max-width: 767px)')
  const activityLimit = isMobile ? 5 : 8

  /* Build stat card configs from live data */
  const stats = buildStats(summary)

  /* Streak week dots — mark active days based on actual activity */
  const streakDays      = summary?.current_streak ?? 0
  const longestStreak   = summary?.longest_streak ?? 0
  const streakActiveDays = summary?.streak_active_days ?? []

  /* Heatmap grid: use API data or empty grid while loading */
  const heatGrid = heatmap ?? []

  return (
    <div id="page-dashboard" className="dash-page">

      {/* ── Page greeting ─────────────────────────────────────────── */}
      <div className="dash-greeting">
        <div>
          <h2 className="dash-greeting__title">
            {(() => {
              const { text, emoji } = getGreeting()
              const name = user?.full_name
              return `${text}${name ? `, ${name}` : ''} ${emoji}`
            })()}
          </h2>
          <p className="dash-greeting__sub">
            Here's what's happening with your progress today.
          </p>
        </div>
        <div className="dash-date-badge">
          <CalendarDays size={14} className="mr-1.5" />
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* ── Global error banner ───────────────────────────────────── */}
      {error && <ErrorBanner message={error} onRetry={refetch} />}

      {/* ── Stat cards row ────────────────────────────────────────── */}
      {isLoading ? (
        <StatSkeletons />
      ) : (
        <div className="dash-stat-grid">
          {stats.map((s, i) => (
            <StatCard key={s.id} {...s} delay={i * 80} />
          ))}
        </div>
      )}

      {/* ── Charts row ────────────────────────────────────────────── */}
      <div className="dash-charts-grid">
        <section className="dash-card dash-card--chart" id="section-chart-weekly">
          <WeeklyProgressChart data={weekly || []} isLoading={isLoading} />
        </section>
        <section className="dash-card dash-card--chart" id="section-chart-monthly">
          <MonthlyProgressChart
            data={monthly || []}
            isLoading={isLoading}
            year={monthlyYear}
            availableYears={availableYears}
            onYearChange={changeMonthlyYear}
          />
        </section>
      </div>

      {/* ── Main two-column grid ──────────────────────────────────── */}
      <div className="dash-main-grid">

        {/* ── LEFT column ── */}
        <div className="dash-col-left">

          {/* Learning Heatmap (chart component) */}
          <section className="dash-card" id="section-heatmap">
            <LearningHeatmap data={heatmap || []} isLoading={isLoading} />
          </section>

          {/* Recent Activity Feed */}
          <section className="dash-card" id="section-activity">
            <div className="dash-card__header">
              <div className="dash-card__title-group">
                <h3 className="dash-card__title">Recent Activity</h3>
                <span className="dash-card__subtitle">{`Last ${activityLimit} activities`}</span>
              </div>
              <button className="dash-card__action-btn" id="btn-view-all-activity" onClick={() => setShowActivityModal(true)}>
                View all
                <ChevronRight size={14} className="ml-0.5" />
              </button>
            </div>

            {isLoading ? (
              <ActivitySkeleton />
            ) : recent && recent.length > 0 ? (
              <ul className="activity-feed">
                {recent.slice(0, activityLimit).map((item, i) => (
                  <li
                    key={item.id ?? i}
                    className="activity-item"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <span
                      className="activity-item__dot"
                      style={{ background: TYPE_DOT[item.type] ?? '#6366f1' }}
                    />
                    <div className="activity-item__body">
                      <p className="activity-item__text">{item.text}</p>
                      <span className="activity-item__time">{item.time}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="dash-empty">No recent activity yet.</p>
            )}
          </section>
        </div>

        {/* ── RIGHT column ── */}
        <div className="dash-col-right">

          {/* Quick Tasks panel */}
          <section className="dash-card" id="section-quick-tasks">
            <div className="dash-card__header">
              <div className="dash-card__title-group">
                <h3 className="dash-card__title">Quick Tasks</h3>
                <span className="dash-card__subtitle">Pending items</span>
              </div>
              <button className="dash-card__action-btn" id="btn-add-quick-task" onClick={() => navigate('/tasks')}>
                <Plus size={14} className="mr-0.5" />
                Add
              </button>
            </div>

            {isLoading ? (
              <TaskSkeleton />
            ) : pendingTasks.length > 0 ? (
              <>
                <ul className="quick-tasks">
                  {pendingTasks.slice(0, 5).map(task => {
                    const skillObj = skills.find(s => s.id === task.skill)
                    const skillName = skillObj?.name ?? 'Unknown Skill'
                    const skillColor = skillObj?.color ?? '#6366f1'
                    return (
                      <li
                        key={task.id}
                        className="qtask"
                        onClick={() => navigate('/tasks')}
                      >
                        <div className="qtask__left" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: 1, minWidth: 0 }}>
                          <span className="qtask__check" style={{ borderColor: `${skillColor}80` }} />
                          <span className="qtask__label" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {task.title}
                          </span>
                        </div>
                        <div className="qtask__right" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                          <span
                            className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-slate-900/40"
                            style={{
                              color: skillColor,
                              borderColor: `${skillColor}35`,
                            }}
                          >
                            {skillName}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Pending
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ul>

                {pendingTasks.length > 5 && (
                  <div
                    className="qtask-more"
                    onClick={() => navigate('/tasks')}
                    style={{
                      textAlign: 'center',
                      fontSize: '0.8rem',
                      color: '#6366f1',
                      fontWeight: '600',
                      cursor: 'pointer',
                      marginTop: '-0.5rem',
                      marginBottom: '1.25rem',
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      background: 'rgba(99, 102, 241, 0.05)',
                      border: '1px dashed rgba(99, 102, 241, 0.2)',
                      transition: 'all 0.2s',
                    }}
                  >
                    + {pendingTasks.length - 5} more tasks
                  </div>
                )}

                {/* Progress bar */}
                <div className="qtask-progress">
                  <div className="qtask-progress__labels">
                    <span>Task Progress</span>
                    <span>
                      {summary?.tasks_done ?? 0} / {summary?.total_tasks ?? 0}
                    </span>
                  </div>
                  <div className="qtask-progress__track">
                    <div
                      className="qtask-progress__fill"
                      style={{
                        width: `${(summary?.total_tasks ?? 0) > 0
                          ? ((summary?.tasks_done ?? 0) / summary.total_tasks) * 100
                          : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <p className="dash-empty">No pending tasks 🎉</p>
            )}
          </section>

          {/* Streak card */}
          <section className="dash-card dash-card--streak" id="section-streak">
            <div className="streak-fire text-amber-500">
              <Flame size={40} strokeWidth={1.8} className="animate-pulse" />
            </div>
            <p className="streak-label">Current Streak</p>
            <div className="streak-value">
              {isLoading ? <span className="skeleton-shimmer" style={{ display: 'inline-block', width: '3rem', height: '3rem', borderRadius: '0.5rem' }} /> : streakDays}
            </div>
            <p className="streak-days-label">days in a row</p>

            {/* Mini week dots — highlight only actually active days */}
            <div className="streak-week">
              {DAYS.map((d) => (
                <div key={d} className="streak-week__item">
                  <div className={`streak-week__dot ${streakActiveDays.includes(d) ? 'streak-week__dot--active' : ''}`} />
                  <span>{d[0]}</span>
                </div>
              ))}
            </div>

            <div className="streak-record flex items-center justify-center text-xs text-slate-400 mt-2 font-medium">
              <Trophy size={13} className="text-amber-400 mr-1.5" />
              <span>Personal best: <strong>{isLoading ? '—' : `${longestStreak} days`}</strong></span>
            </div>
          </section>

          {/* Skills overview mini */}
          <section className="dash-card" id="section-skills-mini">
            <div className="dash-card__header">
              <div className="dash-card__title-group">
                <h3 className="dash-card__title">Top Skills</h3>
                <span className="dash-card__subtitle">By progress</span>
              </div>
              <button className="dash-card__action-btn" id="btn-view-all-skills" onClick={() => navigate('/skills')}>
                View all
                <ChevronRight size={14} className="ml-0.5" />
              </button>
            </div>

            {isLoading ? (
              <div className="skeleton-feed">
                {[80, 65, 50, 40].map(w => (
                  <div key={w} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <SkeletonText width={`${w}%`} height="12px" />
                    <SkeletonText width="100%" height="5px" />
                  </div>
                ))}
              </div>
            ) : topSkills.length > 0 ? (
              <ul className="skills-mini">
                {topSkills.map(s => {
                  const completedTasksCount = Math.round((s.progress / 100) * s.target_tasks)
                  return (
                    <li key={s.id ?? s.name} className="skill-mini-item">
                      <div className="skill-mini-item__top">
                        <span className="skill-mini-item__name">{s.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.72rem', color: 'rgba(148,163,184,0.5)', fontWeight: '500' }}>
                            ({completedTasksCount} / {s.target_tasks} tasks)
                          </span>
                          <span className="skill-mini-item__pct">{s.progress}%</span>
                        </div>
                      </div>
                      <div className="skill-mini-item__track">
                        <div
                          className="skill-mini-item__fill"
                          style={{
                            width: `${s.progress}%`,
                            background: s.color ?? '#6366f1',
                          }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="dash-empty">Create your first skill to start tracking progress</p>
            )}
          </section>

        </div>
      </div>
      {/* ── Activity Modal ─────────────────────────────────────────── */}
      {showActivityModal && (
        <div className="activity-modal-overlay" onClick={() => setShowActivityModal(false)}>
          <div className="activity-modal" onClick={e => e.stopPropagation()}>
            <div className="activity-modal__header">
              <div>
                <h2 className="activity-modal__title">All Recent Activity</h2>
                <p className="activity-modal__sub">Your complete activity history</p>
              </div>
              <button
                className="activity-modal__close"
                id="btn-close-activity-modal"
                onClick={() => setShowActivityModal(false)}
                aria-label="Close"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <div className="activity-modal__body">
              {recent && recent.length > 0 ? (
                <ul className="activity-feed">
                  {recent.map((item, i) => (
                    <li
                      key={item.id ?? i}
                      className="activity-item"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <span
                        className="activity-item__dot"
                        style={{ background: TYPE_DOT[item.type] ?? '#6366f1' }}
                      />
                      <div className="activity-item__body">
                        <p className="activity-item__text">{item.text}</p>
                        <span className="activity-item__time">{item.time}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="dash-empty">No recent activity yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
