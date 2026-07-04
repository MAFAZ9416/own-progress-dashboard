import React from 'react'
import { ResponsiveContainer, AreaChart, Area } from 'recharts'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import './StatCard.css'

export default function StatCard({ 
  title, 
  value, 
  trend, 
  trendDirection,
  sparkline = [], 
  color = 'purple', 
  icon: Icon, 
  isLoading 
}) {
  
  // Format numeric values (e.g. 12842 -> "12,842")
  const formatValue = (val) => {
    if (val === undefined || val === null) return '0'
    if (typeof val === 'number') {
      // Check if it's a percentage completion rate
      if (title.toLowerCase().includes('rate')) {
        return `${val}%`
      }
      return val.toLocaleString()
    }
    return val
  }

  // Handle Loading Skeleton State
  if (isLoading) {
    return (
      <div className={`admin-stat-card admin-glow-card admin-stat-card--loading`}>
        <div className="admin-stat-card__header">
          <div className="admin-stat-card__icon-skeleton skeleton-shimmer" />
          <div className="admin-stat-card__title-skeleton skeleton-shimmer" />
        </div>
        <div className="admin-stat-card__body">
          <div className="admin-stat-card__value-skeleton skeleton-shimmer" />
          <div className="admin-stat-card__trend-skeleton skeleton-shimmer" />
        </div>
        <div className="admin-stat-card__spark-skeleton skeleton-shimmer" />
      </div>
    )
  }

  // Format sparkline data for Recharts
  const chartData = sparkline.map((val, idx) => ({ id: idx, value: val }))
  
  // Determine trend state
  // Determine trend state
  const direction = trendDirection || (trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral')
  const isUp = direction === 'up'
  const isDown = direction === 'down'
  const trendText = trend !== undefined ? `${isUp ? '+' : ''}${trend}%` : '0%'

  // Map color strings to active hex colors and gradients
  const colorMap = {
    purple: { stroke: '#a78bfa', fill: 'rgba(167, 139, 250, 0.15)', iconBg: 'rgba(167, 139, 250, 0.08)' },
    blue: { stroke: '#60a5fa', fill: 'rgba(96, 165, 250, 0.15)', iconBg: 'rgba(96, 165, 250, 0.08)' },
    yellow: { stroke: '#fbbf24', fill: 'rgba(251, 191, 36, 0.15)', iconBg: 'rgba(251, 191, 36, 0.08)' },
    red: { stroke: '#f87171', fill: 'rgba(248, 113, 113, 0.15)', iconBg: 'rgba(248, 113, 113, 0.08)' },
    green: { stroke: '#34d399', fill: 'rgba(52, 211, 153, 0.15)', iconBg: 'rgba(52, 211, 153, 0.08)' },
    orange: { stroke: '#f97316', fill: 'rgba(249, 115, 22, 0.15)', iconBg: 'rgba(249, 115, 22, 0.08)' },
  }

  const activeColor = colorMap[color] || colorMap.purple

  return (
    <div className={`admin-stat-card admin-glow-card admin-stat-card--${color}`}>
      <div className="admin-stat-card__header">
        <div className="admin-stat-card__icon-wrap" style={{ background: activeColor.iconBg, color: activeColor.stroke }}>
          {Icon && <Icon size={16} strokeWidth={2.2} />}
        </div>
        <span className="admin-stat-card__title">{title}</span>
      </div>

      <div className="admin-stat-card__body">
        <div className="admin-stat-card__value-row">
          <span className="admin-stat-card__value">
            {formatValue(value)}
          </span>
          
          <div className={`admin-stat-card__trend admin-stat-card__trend--${direction}`}>
            {isUp && <ArrowUpRight size={13} strokeWidth={2.5} />}
            {isDown && <ArrowDownRight size={13} strokeWidth={2.5} />}
            <span>{trendText}</span>
          </div>
        </div>
        <span className="admin-stat-card__trend-subtitle">vs last month</span>
      </div>

      {/* Sparkline chart */}
      <div className="admin-stat-card__sparkline">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id={`sparkGrad-${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={activeColor.stroke} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={activeColor.stroke} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={activeColor.stroke}
                strokeWidth={1.5}
                fill={`url(#sparkGrad-${color})`}
                dot={false}
                isAnimationActive={true}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="admin-stat-card__no-spark">No sparkline data</div>
        )}
      </div>
    </div>
  )
}
