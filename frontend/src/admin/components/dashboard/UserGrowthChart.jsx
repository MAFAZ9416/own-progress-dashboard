import React from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'
import { TrendingUp, Calendar } from 'lucide-react'
import './UserGrowthChart.css'

export default function UserGrowthChart({ data = [], totalValue, trend, isLoading, period = 'month', onPeriodChange }) {
  
  // Format numeric ticks (e.g., 5000 -> "5K")
  const formatYAxis = (tick) => {
    if (tick >= 1000) return `${tick / 1000}K`
    return tick
  }

  // Handle Loading State
  if (isLoading) {
    return (
      <div className="admin-chart-card admin-glow-card">
        <div className="admin-chart-card__header">
          <div className="admin-chart-card__title-skeleton skeleton-shimmer" />
          <div className="admin-chart-card__filter-skeleton skeleton-shimmer" />
        </div>
        <div className="admin-chart-card__metrics">
          <div className="admin-chart-card__val-skeleton skeleton-shimmer" />
        </div>
        <div className="admin-chart-card__plot-skeleton skeleton-shimmer" />
      </div>
    )
  }

  const hasData = data && data.length > 0
  const isPositive = trend >= 0

  return (
    <div className="admin-chart-card admin-glow-card">
      <div className="admin-chart-card__header">
        <div className="admin-chart-card__title-group">
          <h3 className="admin-chart-card__title">User Growth</h3>
          <span className="admin-chart-card__subtitle">User acquisition trends</span>
        </div>
        
        <div className="admin-chart-card__actions">
          <div className="admin-chart-card__select-wrapper">
            <Calendar size={12} className="admin-chart-card__select-icon" />
            <select className="admin-chart-card__select" value={period} onChange={(e) => onPeriodChange(e.target.value)}>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      <div className="admin-chart-card__metrics">
        <span className="admin-chart-card__value">
          {totalValue ? totalValue.toLocaleString() : '0'}
        </span>
        {trend !== undefined && (
          <div className={`admin-chart-card__trend admin-chart-card__trend--${isPositive ? 'up' : 'down'}`}>
            <TrendingUp size={13} />
            <span>{isPositive ? '+' : ''}{trend}%</span>
          </div>
        )}
      </div>

      <div className="admin-chart-card__plot">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="userGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                stroke="#5e6b7e" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
              />
              <YAxis 
                stroke="#5e6b7e" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={formatYAxis} 
                dx={-10}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f1021', 
                  borderColor: 'rgba(99, 102, 241, 0.25)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontFamily: 'Inter, sans-serif'
                }}
                labelStyle={{ fontWeight: '600', color: '#a78bfa' }}
                cursor={{ stroke: 'rgba(124, 58, 237, 0.15)', strokeWidth: 1 }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#7c3aed" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#userGrowthGrad)" 
                isAnimationActive={true}
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="admin-chart-card__empty">No user acquisition data available.</div>
        )}
      </div>
    </div>
  )
}
