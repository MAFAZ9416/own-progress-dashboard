import { useMemo, memo } from 'react'
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

/* ─── Custom Tooltip ────────────────────────────────────────────────────── */
function WeeklyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      <div className="chart-tooltip__row">
        <span className="chart-tooltip__dot" style={{ background: '#a78bfa' }} />
        <span className="chart-tooltip__key">Activities</span>
        <span className="chart-tooltip__val">{payload[0]?.value ?? 0}</span>
      </div>
      {payload[1] && (
        <div className="chart-tooltip__row">
          <span className="chart-tooltip__dot" style={{ background: '#60a5fa' }} />
          <span className="chart-tooltip__key">Tasks done</span>
          <span className="chart-tooltip__val">{payload[1]?.value ?? 0}</span>
        </div>
      )}
    </div>
  )
}

/**
 * WeeklyProgressChart
 *
 * Smooth area-line chart plotting daily activity counts for the current week.
 *
 * Props:
 *   data – array from GET /api/dashboard/weekly/
 *          [{ day: "Mon", count: 3, tasks_done?: 2 }, ...]
 *   isLoading – boolean
 */
const WeeklyProgressChart = memo(function WeeklyProgressChart({ data = [], isLoading = false }) {
  const chartData = useMemo(() => data.map(d => ({
    day: d.day ?? d.date ?? '—',
    count: d.completed_tasks ?? d.count ?? d.activities ?? 0,
    tasksDone: d.completed_tasks ?? d.tasks_done ?? d.tasksDone ?? 0,
  })), [data])

  const maxVal = useMemo(
    () => Math.max(...chartData.map(d => d.count), 1),
    [chartData]
  )

  return (
    <div className="chart-wrap" id="chart-weekly">
      <div className="chart-wrap__header">
        <div>
          <h3 className="chart-wrap__title">Weekly Progress</h3>
          <p className="chart-wrap__sub">Activity per day this week</p>
        </div>
        <div className="chart-legend">
          <span className="chart-legend__item">
            <span className="chart-legend__dot" style={{ background: '#a78bfa' }} />
            Activities
          </span>
          <span className="chart-legend__item">
            <span className="chart-legend__dot" style={{ background: '#60a5fa' }} />
            Tasks done
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="chart-skeleton skeleton-shimmer" style={{ height: 200 }} />
      ) : chartData.length === 0 ? (
        <p className="dash-empty">No weekly data yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="gradActivities" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}    />
              </linearGradient>
              <linearGradient id="gradTasks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(99,102,241,0.1)"
              vertical={false}
            />

            <XAxis
              dataKey="day"
              tick={{ fill: 'rgba(148,163,184,0.55)', fontSize: 11, fontFamily: 'Inter' }}
              axisLine={false}
              tickLine={false}
              dy={6}
            />

            <YAxis
              domain={[0, maxVal + 1]}
              tick={{ fill: 'rgba(148,163,184,0.45)', fontSize: 10, fontFamily: 'Inter' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={32}
            />

            <Tooltip content={WeeklyTooltip} cursor={{ stroke: 'rgba(124,58,237,0.2)', strokeWidth: 1 }} />

            {/* Activities area + line */}
            <Area
              type="monotone"
              dataKey="count"
              stroke="#a78bfa"
              strokeWidth={2.5}
              fill="url(#gradActivities)"
              dot={{ fill: '#a78bfa', r: 3.5, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#a78bfa', stroke: '#1e1b4b', strokeWidth: 2 }}
            />

            {/* Tasks done line (no fill) */}
            <Area
              type="monotone"
              dataKey="tasksDone"
              stroke="#60a5fa"
              strokeWidth={2}
              fill="url(#gradTasks)"
              strokeDasharray="5 3"
              dot={{ fill: '#60a5fa', r: 2.5, strokeWidth: 0 }}
              activeDot={{ r: 4, fill: '#60a5fa', stroke: '#1e3a5f', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
})

export default WeeklyProgressChart
