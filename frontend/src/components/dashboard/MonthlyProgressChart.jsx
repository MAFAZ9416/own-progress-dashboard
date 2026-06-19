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

/* ─── Custom Tooltip ────────────────────────────────────────────────────── */
function MonthlyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      <div className="chart-tooltip__row">
        <span className="chart-tooltip__dot" style={{ background: '#6366f1' }} />
        <span className="chart-tooltip__key">Activities</span>
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
 * Vertical bar chart plotting monthly activity totals across the year.
 *
 * Props:
 *   data – array from GET /api/dashboard/monthly/
 *          [{ month: "Jan", count: 12 }, ...]
 *   isLoading – boolean
 */
export default function MonthlyProgressChart({ data = [], isLoading = false }) {
  /* Normalise key names */
  const chartData = data.map(d => ({
    month: d.month ?? d.label ?? '—',
    count: d.count ?? d.activities ?? 0,
  }))

  const currentMonth = new Date().toLocaleString('default', { month: 'short' })

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
          <p className="chart-wrap__sub">Total activities per month</p>
        </div>
        <div className="chart-badge">
          <span className="chart-badge__dot" />
          {new Date().getFullYear()}
        </div>
      </div>

      {isLoading ? (
        <div className="chart-skeleton skeleton-shimmer" style={{ height: 200 }} />
      ) : chartData.length === 0 ? (
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

            <Tooltip content={<MonthlyTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />

            <Bar dataKey="count" shape={<RoundedBar />} maxBarSize={32}>
              {chartData.map((entry, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={
                    entry.month === currentMonth
                      ? '#a78bfa'                        /* highlight current month */
                      : BAR_COLORS[i % BAR_COLORS.length]
                  }
                  opacity={entry.month === currentMonth ? 1 : 0.72}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
