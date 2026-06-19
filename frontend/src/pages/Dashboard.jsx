import StatCard from '../components/dashboard/StatCard'

/* ─── Static placeholder data (API connection comes later) ─────────────── */
const STATS = [
  {
    id: 'stat-total-skills',
    label: 'Total Skills',
    value: 12,
    gradient: 'linear-gradient(135deg, #7c3aed, #6366f1)',
    trend: { value: '+3', positive: true },
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    id: 'stat-total-tasks',
    label: 'Total Tasks',
    value: 48,
    gradient: 'linear-gradient(135deg, #6366f1, #3b82f6)',
    trend: { value: '+8', positive: true },
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: 'stat-current-streak',
    label: 'Current Streak',
    value: 7,
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
    value: 21,
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

const RECENT_ACTIVITY = [
  { id: 1, type: 'skill',  text: 'Added new skill — React Advanced Patterns', time: '2h ago',  dot: '#7c3aed' },
  { id: 2, type: 'task',   text: 'Completed task — Build auth flow',           time: '5h ago',  dot: '#3b82f6' },
  { id: 3, type: 'streak', text: 'Extended streak to 7 days 🔥',               time: '1d ago',  dot: '#f59e0b' },
  { id: 4, type: 'task',   text: 'Completed task — Setup project architecture', time: '2d ago', dot: '#3b82f6' },
  { id: 5, type: 'skill',  text: 'Updated skill — Django REST Framework',       time: '3d ago', dot: '#7c3aed' },
]

const QUICK_TASKS = [
  { id: 1, label: 'Finish Dashboard UI',  done: false, priority: 'high'   },
  { id: 2, label: 'Connect Login API',    done: true,  priority: 'done'   },
  { id: 3, label: 'Design Skills page',   done: false, priority: 'medium' },
  { id: 4, label: 'Write unit tests',     done: false, priority: 'low'    },
]

const PRIORITY_DOT = {
  high:   '#f87171',
  medium: '#fb923c',
  low:    '#94a3b8',
  done:   '#4ade80',
}

/* ─── Week activity heatmap data ───────────────────────────────────────── */
const DAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const WEEKS = 12
const heatmap = Array.from({ length: WEEKS }, (_, w) =>
  Array.from({ length: 7 }, (_, d) => {
    const r = Math.random()
    if (r < 0.3) return 0
    if (r < 0.55) return 1
    if (r < 0.75) return 2
    if (r < 0.9)  return 3
    return 4
  })
)
const heatColors = ['#1e293b', '#312e81', '#4338ca', '#6366f1', '#a78bfa']

/* ─── Component ────────────────────────────────────────────────────────── */
export default function Dashboard() {
  return (
    <div id="page-dashboard" className="dash-page">

      {/* ── Page greeting ────────────────────────────────────────── */}
      <div className="dash-greeting">
        <div>
          <h2 className="dash-greeting__title">Good afternoon 👋</h2>
          <p className="dash-greeting__sub">Here's what's happening with your progress today.</p>
        </div>
        <div className="dash-date-badge">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
          </svg>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* ── Stat cards row ───────────────────────────────────────── */}
      <div className="dash-stat-grid">
        {STATS.map((s, i) => (
          <StatCard key={s.id} {...s} delay={i * 80} />
        ))}
      </div>

      {/* ── Main two-column grid ─────────────────────────────────── */}
      <div className="dash-main-grid">

        {/* ── LEFT column ── */}
        <div className="dash-col-left">

          {/* Activity Heatmap */}
          <section className="dash-card" id="section-heatmap">
            <div className="dash-card__header">
              <div className="dash-card__title-group">
                <h3 className="dash-card__title">Activity Heatmap</h3>
                <span className="dash-card__subtitle">Last 12 weeks</span>
              </div>
              <div className="heatmap-legend">
                {heatColors.map((c, i) => (
                  <span key={i} className="heatmap-legend__cell" style={{ background: c }} />
                ))}
                <span className="heatmap-legend__label">More</span>
              </div>
            </div>

            <div className="heatmap-wrap">
              {/* Day labels on left */}
              <div className="heatmap-days">
                {DAYS.map(d => <span key={d}>{d}</span>)}
              </div>
              {/* Grid */}
              <div className="heatmap-grid">
                {heatmap.map((week, wi) => (
                  <div key={wi} className="heatmap-col">
                    {week.map((level, di) => (
                      <div
                        key={di}
                        className="heatmap-cell"
                        style={{ background: heatColors[level] }}
                        title={`${DAYS[di]}: ${level} activities`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
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
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>

            <ul className="activity-feed">
              {RECENT_ACTIVITY.map((item, i) => (
                <li
                  key={item.id}
                  className="activity-item"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <span className="activity-item__dot" style={{ background: item.dot }} />
                  <div className="activity-item__body">
                    <p className="activity-item__text">{item.text}</p>
                    <span className="activity-item__time">{item.time}</span>
                  </div>
                </li>
              ))}
            </ul>
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
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                </svg>
                Add
              </button>
            </div>

            <ul className="quick-tasks">
              {QUICK_TASKS.map(task => (
                <li key={task.id} className={`qtask ${task.done ? 'qtask--done' : ''}`}>
                  <span className="qtask__check">
                    {task.done && (
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    )}
                  </span>
                  <span className="qtask__label">{task.label}</span>
                  <span
                    className="qtask__priority"
                    style={{ background: PRIORITY_DOT[task.priority] + '26', color: PRIORITY_DOT[task.priority] }}
                  >
                    {task.priority}
                  </span>
                </li>
              ))}
            </ul>

            {/* Progress bar */}
            <div className="qtask-progress">
              <div className="qtask-progress__labels">
                <span>Progress</span>
                <span>{QUICK_TASKS.filter(t => t.done).length} / {QUICK_TASKS.length}</span>
              </div>
              <div className="qtask-progress__track">
                <div
                  className="qtask-progress__fill"
                  style={{ width: `${(QUICK_TASKS.filter(t => t.done).length / QUICK_TASKS.length) * 100}%` }}
                />
              </div>
            </div>
          </section>

          {/* Streak card */}
          <section className="dash-card dash-card--streak" id="section-streak">
            <div className="streak-fire">🔥</div>
            <p className="streak-label">Current Streak</p>
            <div className="streak-value">7</div>
            <p className="streak-days-label">days in a row</p>

            {/* Mini week dots */}
            <div className="streak-week">
              {DAYS.map((d, i) => (
                <div key={d} className="streak-week__item">
                  <div className={`streak-week__dot ${i < 5 ? 'streak-week__dot--active' : ''}`} />
                  <span>{d[0]}</span>
                </div>
              ))}
            </div>

            <p className="streak-record">🏆 Personal best: <strong>21 days</strong></p>
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
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>

            <ul className="skills-mini">
              {[
                { name: 'React',          pct: 82, color: '#61dafb' },
                { name: 'Django',         pct: 74, color: '#092e20' },
                { name: 'TypeScript',     pct: 65, color: '#3178c6' },
                { name: 'System Design',  pct: 50, color: '#a78bfa' },
              ].map(s => (
                <li key={s.name} className="skill-mini-item">
                  <div className="skill-mini-item__top">
                    <span className="skill-mini-item__name">{s.name}</span>
                    <span className="skill-mini-item__pct">{s.pct}%</span>
                  </div>
                  <div className="skill-mini-item__track">
                    <div
                      className="skill-mini-item__fill"
                      style={{ width: `${s.pct}%`, background: s.color }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>

        </div>
      </div>
    </div>
  )
}
