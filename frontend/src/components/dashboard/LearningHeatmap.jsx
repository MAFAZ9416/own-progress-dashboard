import { useState, useMemo, memo } from 'react'

/* ─── Constants ─────────────────────────────────────────────────────────── */
const DAYS        = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HEAT_COLORS = ['#1e293b', '#312e81', '#4338ca', '#6366f1', '#a78bfa']
const HEAT_LABELS = ['No activity', 'Light', 'Moderate', 'Active', 'Very active']

/* ─── Tooltip (floating on hover) ──────────────────────────────────────── */
function HeatTooltip({ day, week, level, visible, x, y }) {
  if (!visible) return null
  return (
    <div
      className="heat-tooltip"
      style={{ left: x, top: y }}
      role="tooltip"
    >
      <span className="heat-tooltip__dot" style={{ background: HEAT_COLORS[Math.min(level, 4)] }} />
      <span><strong>{day}</strong> — Week {week + 1}</span>
      <span className="heat-tooltip__level">{HEAT_LABELS[Math.min(level, 4)]}</span>
    </div>
  )
}

/**
 * LearningHeatmap
 *
 * A GitHub-style contribution grid showing 12 weeks × 7 days of activity.
 * Replaces the plain CSS heatmap in Dashboard.jsx with a richer interactive
 * Recharts-independent implementation (pure DOM — Recharts has no heatmap type).
 *
 * Props:
 *   data      – 2-D array from GET /api/dashboard/heatmap/
 *               data[weekIndex][dayIndex] = 0..4
 *   isLoading – boolean
 */
const LearningHeatmap = memo(function LearningHeatmap({ data = [], isLoading = false }) {
  const [tooltip, setTooltip] = useState({ visible: false, day: '', week: 0, level: 0, x: 0, y: 0 })

  const handleCellEnter = (e, dayLabel, weekIdx, level) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const parentRect = e.currentTarget.closest('.heat-grid-wrap')?.getBoundingClientRect() ?? rect
    setTooltip({
      visible: true,
      day:     dayLabel,
      week:    weekIdx,
      level,
      x: rect.left - parentRect.left + rect.width / 2,
      y: rect.top  - parentRect.top  - 52,
    })
  }

  const handleCellLeave = () => setTooltip(t => ({ ...t, visible: false }))

  const activeDays = useMemo(
    () => data.flatMap(w => w).filter(v => v > 0).length,
    [data]
  )
  const weekCount      = data.length

  return (
    <div className="chart-wrap" id="chart-heatmap">
      <div className="chart-wrap__header">
        <div>
          <h3 className="chart-wrap__title">Learning Heatmap</h3>
          <p className="chart-wrap__sub">
            {isLoading ? 'Loading…' : `${activeDays} active day${activeDays !== 1 ? 's' : ''} in the last ${weekCount} weeks`}
          </p>
        </div>

        {/* Legend */}
        <div className="heat-legend">
          <span className="heat-legend__label">Less</span>
          {HEAT_COLORS.map((c, i) => (
            <span
              key={i}
              className="heat-legend__cell"
              style={{ background: c }}
              title={HEAT_LABELS[i]}
            />
          ))}
          <span className="heat-legend__label">More</span>
        </div>
      </div>

      {isLoading ? (
        <div className="chart-skeleton skeleton-shimmer" style={{ height: 120 }} />
      ) : data.length === 0 ? (
        <p className="dash-empty">No heatmap data yet.</p>
      ) : (
        <div className="heat-grid-wrap" style={{ position: 'relative' }}>
          {/* Floating tooltip */}
          <HeatTooltip {...tooltip} />

          <div className="heat-grid-inner">
            {/* Day labels column */}
            <div className="heat-day-labels" aria-hidden="true">
              {DAYS.map(d => <span key={d}>{d}</span>)}
            </div>

            {/* Week columns */}
            <div className="heat-grid">
              {data.map((week, wi) => (
                <div key={wi} className="heat-col">
                  {(Array.isArray(week) ? week : []).map((level, di) => {
                    const safeLevel = Math.min(level, 4)
                    return (
                      <div
                        key={di}
                        className="heat-cell"
                        style={{ background: HEAT_COLORS[safeLevel] }}
                        onMouseEnter={e => handleCellEnter(e, DAYS[di], wi, safeLevel)}
                        onMouseLeave={handleCellLeave}
                        aria-label={`${DAYS[di]} week ${wi + 1}: ${HEAT_LABELS[safeLevel]}`}
                        role="img"
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Summary stats strip */}
          <div className="heat-stats">
            <div className="heat-stat">
              <span className="heat-stat__val">{weekCount}</span>
              <span className="heat-stat__key">Weeks tracked</span>
            </div>
            <div className="heat-stat-divider" />
            <div className="heat-stat">
              <span className="heat-stat__val">{activeDays}</span>
              <span className="heat-stat__key">Active days</span>
            </div>
            <div className="heat-stat-divider" />
            <div className="heat-stat">
              <span className="heat-stat__val">
                {weekCount > 0 ? Math.round((activeDays / (weekCount * 7)) * 100) : 0}%
              </span>
              <span className="heat-stat__key">Consistency</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

export default LearningHeatmap
