import React from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { Calendar } from 'lucide-react'
import './WeeklyActivityChart.css'

export default function WeeklyActivityChart({ data = [], isLoading, period = 'month', onPeriodChange }) {
  
  // Format numeric ticks (e.g., 1000 -> "1K")
  const formatYAxis = (tick) => {
    if (tick >= 1000) return `${tick / 1000}K`
    return tick
  }

  // Handle Loading Skeleton State
  if (isLoading) {
    return (
      <div className="admin-bar-card admin-glow-card">
        <div className="admin-bar-card__header">
          <div className="admin-bar-card__title-skeleton skeleton-shimmer" />
          <div className="admin-bar-card__filter-skeleton skeleton-shimmer" />
        </div>
        <div className="admin-bar-card__metrics">
          <div className="admin-bar-card__val-skeleton skeleton-shimmer" />
        </div>
        <div className="admin-bar-card__plot-skeleton skeleton-shimmer" />
      </div>
    )
  }

  const hasData = data && data.length > 0
  
  // Calculate total activities in current week
  const totalActivities = data.reduce((acc, curr) => acc + (curr.value || 0), 0)

  // Map header title based on current period
  const titleMap = {
    week: 'Weekly Activity',
    month: 'Monthly Activity',
    year: 'Yearly Activity'
  }
  const title = titleMap[period] || 'Weekly Activity'

  return (
    <div className="admin-bar-card admin-glow-card">
      <div className="admin-bar-card__header">
        <div className="admin-bar-card__title-group">
          <h3 className="admin-bar-card__title">{title}</h3>
          <span className="admin-bar-card__subtitle">Daily actions completed</span>
        </div>
        <div className="admin-bar-card__actions">
          <div className="admin-bar-card__select-wrapper">
            <Calendar size={12} className="admin-bar-card__select-icon" />
            <select className="admin-bar-card__select" value={period} onChange={(e) => onPeriodChange(e.target.value)}>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      <div className="admin-bar-card__metrics">
        <span className="admin-bar-card__value">
          {totalActivities ? totalActivities.toLocaleString() : '0'}
        </span>
        <span className="admin-bar-card__unit">activities</span>
      </div>

      <div className="admin-bar-card__plot">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="weeklyActivityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#3b82f6" />
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
                cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
              />
              <Bar 
                dataKey="value" 
                fill="url(#weeklyActivityGrad)" 
                radius={[4, 4, 0, 0]}
                barSize={18}
                isAnimationActive={true}
                animationDuration={1000}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="admin-bar-card__empty">No activities logged this week.</div>
        )}
      </div>
    </div>
  )
}
