/**
 * SkeletonCard
 *
 * A shimmer placeholder that matches the visual footprint of a StatCard.
 * Used while dashboard data is being fetched.
 *
 * Props:
 *   className – additional CSS classes (optional)
 *   height    – explicit height override (default '110px')
 *   rows      – number of shimmer rows to render inside the card
 */
export default function SkeletonCard({ className = '', height, rows = 2 }) {
  return (
    <div
      className={`skeleton-card ${className}`}
      style={height ? { height } : undefined}
      aria-hidden="true"
    >
      {/* Icon placeholder */}
      <div className="skeleton-card__icon skeleton-shimmer" />

      {/* Row placeholders */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton-card__row skeleton-shimmer"
          style={{ width: i === 0 ? '55%' : '75%' }}
        />
      ))}
    </div>
  )
}

/**
 * SkeletonText
 *
 * Inline shimmer line — used inside panels (activity feed, task list, etc.)
 */
export function SkeletonText({ width = '100%', height = '12px', className = '' }) {
  return (
    <div
      className={`skeleton-text skeleton-shimmer ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}

/**
 * SkeletonBlock
 *
 * A full-width shimmer rectangle — used for section-level placeholders.
 */
export function SkeletonBlock({ height = '120px', className = '' }) {
  return (
    <div
      className={`skeleton-block skeleton-shimmer ${className}`}
      style={{ height }}
      aria-hidden="true"
    />
  )
}
