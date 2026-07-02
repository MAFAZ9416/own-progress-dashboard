import { useMemo, memo } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

/* ─── Month short names in order ────────────────────────────────────────── */
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/* ─── Custom Tooltip ────────────────────────────────────────────────────── */
function MonthlyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      <div className="chart-tooltip__row">
        <span className="chart-tooltip__dot" style={{ background: '#6366f1' }} />
        <span className="chart-tooltip__key">Completed</span>
        <span className="chart-tooltip__val">{payload[0]?.value ?? 0}</span>
      </div>
    </div>
  )
}

/* ─── Custom bar shape with rounded top ─────────────────────────────────── */
function RoundedBar(props) {
  const { x, y, width, height, fill } = props
  if (!height || height <= 0) return null
  const radius = Math.min(5, width / 2)
  return (
    <path
      d={`
        M ${x},${y + height}
        L ${x},${y + radius}
        Q ${x},${y} ${x + radius},${y}
        L ${x + width - radius},${y}
        Q ${x + width},${y} ${x + width},${y + radius}
        L ${x + width},${y + height}
        Z
      `}
      fill={fill}
    />
  )
}

/**
 * MonthlyProgressChart
 *
 * Vertical bar chart plotting monthly completed-task totals.
 *
 * Props:
 *   data           – array already grouped by month from useDashboard
 *                    [{ month: "Jun", count: 6 }, ...]
 *   isLoading      – boolean
 *   year           – currently displayed year (number)
 *   availableYears – list of years the user has data for
 *   onYearChange   – callback(year) to switch years
 */
const MonthlyProgressChart = memo(function MonthlyProgressChart({
  data = [],
  isLoading = false,
  year,
  availableYears = [],
  onYearChange,
}) {
  const chartData = useMemo(() => {
    const dataMap = Object.fromEntries(data.map(d => [d.month, d.count ?? 0]))
    return MONTHS_SHORT.map(m => ({
      month: m,
      count: dataMap[m] ?? 0,
    }))
  }, [data])

  const currentMonth = new Date().toLocaleString('default', { month: 'short' })
  const displayYear  = year ?? new Date().getFullYear()
  const isCurrentYear = displayYear === new Date().getFullYear()

  /* Gradient palette cycling through purple→indigo→blue */
  const BAR_COLORS = [
    '#7c3aed', '#6d28d9', '#6366f1', '#4f46e5',
    '#4338ca', '#3b82f6', '#2563eb', '#1d4ed8',
    '#6366f1', '#7c3aed', '#8b5cf6', '#a78bfa',
  ]

  return (
    <div className="chart-wrap" id="chart-monthly">
      <div className="chart-wrap__header">
        <div>
          <h3 className="chart-wrap__title">Monthly Progress</h3>
          <p className="chart-wrap__sub">Total completed tasks per month</p>
        </div>

        {/* ── Year selector ── */}
        {availableYears.length > 0 && onYearChange ? (
          <div className="chart-year-select-wrap">
            <select
              id="monthly-year-select"
              className="chart-year-select"
              value={displayYear}
              onChange={e => onYearChange(Number(e.target.value))}
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown size={13} className="chart-year-select__icon" />
          </div>
        ) : (
          <div className="chart-badge">
            <span className="chart-badge__dot" />
            {displayYear}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="chart-skeleton skeleton-shimmer" style={{ height: 200 }} />
      ) : chartData.every(d => d.count === 0) ? (
        <p className="dash-empty">No monthly data yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
            barCategoryGap="28%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(99,102,241,0.1)"
              vertical={false}
            />

            <XAxis
              dataKey="month"
              tick={{ fill: 'rgba(148,163,184,0.55)', fontSize: 11, fontFamily: 'Inter' }}
              axisLine={false}
              tickLine={false}
              dy={6}
            />

            <YAxis
              tick={{ fill: 'rgba(148,163,184,0.45)', fontSize: 10, fontFamily: 'Inter' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={32}
            />

            <Tooltip content={MonthlyTooltip} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />

            <Bar dataKey="count" shape={<RoundedBar />} maxBarSize={32}>
              {chartData.map((entry, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={
                    isCurrentYear && entry.month === currentMonth
                      ? '#a78bfa'                        /* highlight current month */
                      : BAR_COLORS[i % BAR_COLORS.length]
                  }
                  opacity={isCurrentYear && entry.month === currentMonth ? 1 : 0.72}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
})

export default MonthlyProgressChart
