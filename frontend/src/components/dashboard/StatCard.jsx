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
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
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
