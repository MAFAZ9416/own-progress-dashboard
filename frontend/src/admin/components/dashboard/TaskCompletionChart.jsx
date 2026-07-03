import React from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { Calendar } from 'lucide-react'
import './TaskCompletionChart.css'

export default function TaskCompletionChart({ data = [], isLoading, period = 'month', onPeriodChange }) {
  
  // Handle Loading Skeleton State
  if (isLoading) {
    return (
      <div className="admin-donut-card admin-glow-card">
        <div className="admin-donut-card__header">
          <div className="admin-donut-card__title-skeleton skeleton-shimmer" />
          <div className="admin-donut-card__filter-skeleton skeleton-shimmer" />
        </div>
        <div className="admin-donut-card__body">
          <div className="admin-donut-card__pie-skeleton skeleton-shimmer" />
          <div className="admin-donut-card__legend-skeleton">
            <div className="admin-donut-card__legend-skeleton-item skeleton-shimmer" />
            <div className="admin-donut-card__legend-skeleton-item skeleton-shimmer" />
            <div className="admin-donut-card__legend-skeleton-item skeleton-shimmer" />
          </div>
        </div>
      </div>
    )
  }

  // Calculate dynamic totals and percentages
  const completedObj = data.find(item => item.name === 'Completed') || { value: 0 }
  const inProgressObj = data.find(item => item.name === 'In Progress') || { value: 0 }
  const pendingObj = data.find(item => item.name === 'Pending') || { value: 0 }

  const completed = completedObj.value
  const inProgress = inProgressObj.value
  const pending = pendingObj.value
  
  const total = completed + inProgress + pending
  
  const completedPct = total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0'
  const inProgressPct = total > 0 ? ((inProgress / total) * 100).toFixed(1) : '0.0'
  const pendingPct = total > 0 ? ((pending / total) * 100).toFixed(1) : '0.0'

  const chartData = [
    { name: 'Completed', value: completed, color: '#7c3aed' },
    { name: 'In Progress', value: inProgress, color: '#3b82f6' },
    { name: 'Pending', value: pending, color: '#ef4444' },
  ]

  const hasData = total > 0

  return (
    <div className="admin-donut-card admin-glow-card">
      <div className="admin-donut-card__header">
        <div className="admin-donut-card__title-group">
          <h3 className="admin-donut-card__title">Task Completion</h3>
          <span className="admin-donut-card__subtitle">Execution progression rates</span>
        </div>
        <div className="admin-donut-card__actions">
          <div className="admin-donut-card__select-wrapper">
            <Calendar size={12} className="admin-donut-card__select-icon" />
            <select className="admin-donut-card__select" value={period} onChange={(e) => onPeriodChange(e.target.value)}>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      <div className="admin-donut-card__body">
        {hasData ? (
          <>
            {/* Donut Chart Container */}
            <div className="admin-donut-card__chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f1021', 
                      borderColor: 'rgba(99, 102, 241, 0.25)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius="65%"
                    outerRadius="85%"
                    paddingAngle={3}
                    dataKey="value"
                    isAnimationActive={true}
                    animationDuration={800}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              
              {/* Centered label */}
              <div className="admin-donut-card__center">
                <span className="admin-donut-card__center-val">{completedPct}%</span>
                <span className="admin-donut-card__center-label">Completed</span>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="admin-donut-card__legend">
              <div className="admin-donut-card__legend-item">
                <div className="admin-donut-card__legend-dot" style={{ backgroundColor: '#7c3aed' }} />
                <span className="admin-donut-card__legend-label">Completed</span>
                <span className="admin-donut-card__legend-val">
                  {completed} <span className="admin-donut-card__legend-pct">({completedPct}%)</span>
                </span>
              </div>
              <div className="admin-donut-card__legend-item">
                <div className="admin-donut-card__legend-dot" style={{ backgroundColor: '#3b82f6' }} />
                <span className="admin-donut-card__legend-label">In Progress</span>
                <span className="admin-donut-card__legend-val">
                  {inProgress} <span className="admin-donut-card__legend-pct">({inProgressPct}%)</span>
                </span>
              </div>
              <div className="admin-donut-card__legend-item">
                <div className="admin-donut-card__legend-dot" style={{ backgroundColor: '#ef4444' }} />
                <span className="admin-donut-card__legend-label">Pending</span>
                <span className="admin-donut-card__legend-val">
                  {pending} <span className="admin-donut-card__legend-pct">({pendingPct}%)</span>
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="admin-donut-card__empty">No task completions logged yet.</div>
        )}
      </div>
    </div>
  )
}
