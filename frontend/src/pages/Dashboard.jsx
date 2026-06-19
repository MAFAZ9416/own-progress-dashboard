import { useAuth } from '../contexts/AuthContext'
import { useDashboard } from '../hooks/useDashboard'
import StatCard from '../components/dashboard/StatCard'
import WeeklyProgressChart  from '../components/dashboard/WeeklyProgressChart'
import MonthlyProgressChart from '../components/dashboard/MonthlyProgressChart'
import LearningHeatmap      from '../components/dashboard/LearningHeatmap'
import SkeletonCard, { SkeletonText, SkeletonBlock } from '../components/common/SkeletonCard'

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

/** Greeting based on current hour */
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
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
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      id: 'stat-total-tasks',
      label: 'Total Tasks',
      value: summary?.total_tasks ?? 0,
      gradient: 'linear-gradient(135deg, #6366f1, #3b82f6)',
      trend: summary?.tasks_change != null
        ? { value: `${summary.tasks_change > 0 ? '+' : ''}${summary.tasks_change}`, positive: summary.tasks_change >= 0 }
        : undefined,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      id: 'stat-current-streak',
      label: 'Current Streak',
      value: summary?.current_streak ?? 0,
      suffix: 'days',
      gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
      trend: { value: 'active', positive: true },
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          <path d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
        </svg>
      ),
    },
    {
      id: 'stat-longest-streak',
      label: 'Longest Streak',
      value: summary?.longest_streak ?? 0,
      suffix: 'days',
      gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
      trend: { value: 'best', positive: true },
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 3l14 9-14 9V3z" />
        </svg>
      ),
    },
  ]
}

/* ─── Error banner ──────────────────────────────────────────────────────── */
function ErrorBanner({ message, onRetry }) {
  return (
    <div className="dash-error" role="alert">
      <div className="dash-error__inner">
        <svg viewBox="0 0 20 20" fill="currentColor" className="dash-error__icon">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
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
  const { user }                                          = useAuth()
  const { summary, recent, heatmap, isLoading, error, refetch } = useDashboard()

  /* Derive quick-tasks list from summary (top N incomplete + done tasks) */
  const quickTasks = summary?.recent_tasks ?? []

  /* Build stat card configs from live data */
  const stats = buildStats(summary)

  /* Streak week dots — mark active days based on current_streak */
  const streakDays   = summary?.current_streak ?? 0
  const longestStreak = summary?.longest_streak ?? 0

  /* Top skills from summary (backend provides sorted list) */
  const topSkills = summary?.top_skills ?? []

  /* Heatmap grid: use API data or empty grid while loading */
  const heatGrid = heatmap ?? []

  return (
    <div id="page-dashboard" className="dash-page">

      {/* ── Page greeting ─────────────────────────────────────────── */}
      <div className="dash-greeting">
        <div>
          <h2 className="dash-greeting__title">
            {getGreeting()}{user?.username ? `, ${user.username}` : ''} 👋
          </h2>
          <p className="dash-greeting__sub">
            Here's what's happening with your progress today.
          </p>
        </div>
        <div className="dash-date-badge">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
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
          <WeeklyProgressChart data={[]} isLoading={isLoading} />
        </section>
        <section className="dash-card dash-card--chart" id="section-chart-monthly">
          <MonthlyProgressChart data={[]} isLoading={isLoading} />
        </section>
      </div>

      {/* ── Main two-column grid ──────────────────────────────────── */}
      <div className="dash-main-grid">

        {/* ── LEFT column ── */}
        <div className="dash-col-left">

          {/* Learning Heatmap (chart component) */}
          <section className="dash-card" id="section-heatmap">
            <LearningHeatmap data={[]} isLoading={isLoading} />
          </section>

          {/* Recent Activity Feed */}
          <section className="dash-card" id="section-activity">
            <div className="dash-card__header">
              <div className="dash-card__title-group">
                <h3 className="dash-card__title">Recent Activity</h3>
                <span className="dash-card__subtitle">Your latest actions</span>
              </div>
              <button className="dash-card__action-btn" id="btn-view-all-activity">
                View all
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {isLoading ? (
              <ActivitySkeleton />
            ) : recent && recent.length > 0 ? (
              <ul className="activity-feed">
                {recent.map((item, i) => (
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
              <button className="dash-card__action-btn" id="btn-add-quick-task">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add
              </button>
            </div>

            {isLoading ? (
              <TaskSkeleton />
            ) : quickTasks.length > 0 ? (
              <>
                <ul className="quick-tasks">
                  {quickTasks.map(task => {
                    const priority = task.done ? 'done' : (task.priority ?? 'medium')
                    return (
                      <li key={task.id} className={`qtask ${task.done ? 'qtask--done' : ''}`}>
                        <span className="qtask__check">
                          {task.done && (
                            <svg viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </span>
                        <span className="qtask__label">{task.title ?? task.label}</span>
                        <span
                          className="qtask__priority"
                          style={{
                            background: (PRIORITY_DOT[priority] ?? '#94a3b8') + '26',
                            color: PRIORITY_DOT[priority] ?? '#94a3b8',
                          }}
                        >
                          {priority}
                        </span>
                      </li>
                    )
                  })}
                </ul>

                {/* Progress bar */}
                <div className="qtask-progress">
                  <div className="qtask-progress__labels">
                    <span>Progress</span>
                    <span>
                      {quickTasks.filter(t => t.done).length} / {quickTasks.length}
                    </span>
                  </div>
                  <div className="qtask-progress__track">
                    <div
                      className="qtask-progress__fill"
                      style={{
                        width: `${quickTasks.length > 0
                          ? (quickTasks.filter(t => t.done).length / quickTasks.length) * 100
                          : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <p className="dash-empty">No tasks yet. Add your first task!</p>
            )}
          </section>

          {/* Streak card */}
          <section className="dash-card dash-card--streak" id="section-streak">
            <div className="streak-fire">🔥</div>
            <p className="streak-label">Current Streak</p>
            <div className="streak-value">
              {isLoading ? <span className="skeleton-shimmer" style={{ display: 'inline-block', width: '3rem', height: '3rem', borderRadius: '0.5rem' }} /> : streakDays}
            </div>
            <p className="streak-days-label">days in a row</p>

            {/* Mini week dots — active if within current streak */}
            <div className="streak-week">
              {DAYS.map((d, i) => (
                <div key={d} className="streak-week__item">
                  <div className={`streak-week__dot ${i < streakDays ? 'streak-week__dot--active' : ''}`} />
                  <span>{d[0]}</span>
                </div>
              ))}
            </div>

            <p className="streak-record">
              🏆 Personal best:{' '}
              <strong>
                {isLoading ? '—' : `${longestStreak} days`}
              </strong>
            </p>
          </section>

          {/* Skills overview mini */}
          <section className="dash-card" id="section-skills-mini">
            <div className="dash-card__header">
              <div className="dash-card__title-group">
                <h3 className="dash-card__title">Top Skills</h3>
                <span className="dash-card__subtitle">By progress</span>
              </div>
              <button className="dash-card__action-btn" id="btn-view-all-skills">
                View all
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
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
                {topSkills.map(s => (
                  <li key={s.id ?? s.name} className="skill-mini-item">
                    <div className="skill-mini-item__top">
                      <span className="skill-mini-item__name">{s.name}</span>
                      <span className="skill-mini-item__pct">{s.progress ?? s.pct ?? 0}%</span>
                    </div>
                    <div className="skill-mini-item__track">
                      <div
                        className="skill-mini-item__fill"
                        style={{
                          width: `${s.progress ?? s.pct ?? 0}%`,
                          background: s.color ?? '#6366f1',
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="dash-empty">No skills tracked yet.</p>
            )}
          </section>

        </div>
      </div>
    </div>
  )
}
