import { TrendingUp, TrendingDown } from 'lucide-react'

/**
 * StatCard
 *
 * A single KPI card for the dashboard header row.
 *
 * Props:
 *   id         – unique DOM id
 *   label      – metric name (string)
 *   value      – displayed number / string
 *   icon       – JSX svg element
 *   gradient   – CSS gradient string for the icon ring + accent
 *   trend      – optional { value: '+12%', positive: true }
 *   suffix     – optional string appended after value ('days', '%', …)
 *   delay      – animation stagger delay in ms (default 0)
 */
export default function StatCard({
  id,
  label,
  value,
  icon,
  gradient,
  trend,
  suffix = '',
  delay = 0,
}) {
  return (
    <div
      id={id}
      className="stat-card"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Top row: icon + trend badge */}
      <div className="stat-card__header">
        <div className="stat-card__icon-ring" style={{ background: gradient }}>
          {icon}
        </div>

        {trend && (
          <span
            className={`stat-card__trend ${
              trend.positive ? 'stat-card__trend--up' : 'stat-card__trend--down'
            }`}
          >
            {trend.positive ? (
              <TrendingUp size={12} className="mr-0.5" />
            ) : (
              <TrendingDown size={12} className="mr-0.5" />
            )}
            {trend.value}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="stat-card__value">
        {value}
        {suffix && <span className="stat-card__suffix">{suffix}</span>}
      </div>

      {/* Label */}
      <p className="stat-card__label">{label}</p>

      {/* Decorative gradient stripe */}
      <div className="stat-card__stripe" style={{ background: gradient }} />
    </div>
  )
}
