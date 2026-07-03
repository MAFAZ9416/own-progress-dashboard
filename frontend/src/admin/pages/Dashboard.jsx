import React, { useState, useEffect, useCallback } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { adminDashboardService } from '../services/dashboardService'
import HeroBanner from '../components/dashboard/HeroBanner'
import StatsGrid from '../components/dashboard/StatsGrid'
import UserGrowthChart from '../components/dashboard/UserGrowthChart'
import TaskCompletionChart from '../components/dashboard/TaskCompletionChart'
import WeeklyActivityChart from '../components/dashboard/WeeklyActivityChart'
import RecentUsers from '../components/dashboard/RecentUsers'
import RecentActivity from '../components/dashboard/RecentActivity'
import SystemHealth from '../components/dashboard/SystemHealth'
import DatabaseOverview from '../components/dashboard/DatabaseOverview'
import TopSkills from '../components/dashboard/TopSkills'
import LatestFeedback from '../components/dashboard/LatestFeedback'
import Notifications from '../components/dashboard/Notifications'
import QuickActions from '../components/dashboard/QuickActions'
import './Dashboard.css'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [responseTimeMs, setResponseTimeMs] = useState(0)
  const [period, setPeriod] = useState('month')
  const [isFirstLoad, setIsFirstLoad] = useState(true)

  const fetchDashboardData = useCallback(async (isInitial = false) => {
    setIsLoading(isInitial)
    setError(null)
    const startTime = performance.now()

    try {
      const result = await adminDashboardService.getDashboardSummary(period, isInitial)
      const endTime = performance.now()
      setResponseTimeMs(Math.round(endTime - startTime))
      setData(prev => {
        if (!prev || isInitial) return result
        return {
          ...prev,
          stats: result.stats,
          charts: result.charts
        }
      })
      if (isInitial) {
        setIsFirstLoad(false)
      }
    } catch (err) {
      console.error('Error fetching dashboard summary:', err)
      setError(err.response?.data?.message || err.message || 'Failed to connect to administrative server.')
    } finally {
      setIsLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchDashboardData(isFirstLoad)
  }, [period, fetchDashboardData, isFirstLoad])

  // Handles export CSV/JSON from the hero banner
  const handleExportData = () => {
    if (!data) return
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', jsonString)
    downloadAnchor.setAttribute('download', `progressly_admin_report_${new Date().toISOString().slice(0, 10)}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  // Action Success callback to refresh dashboard metrics
  const handleActionSuccess = () => {
    fetchDashboardData(true)
  }

  if (error) {
    return (
      <div className="admin-error-boundary">
        <div className="admin-error-boundary__card admin-glow-card">
          <AlertCircle size={40} className="admin-error-boundary__icon" />
          <h2 className="admin-error-boundary__title">System Error</h2>
          <p className="admin-error-boundary__message">{error}</p>
          <button 
            onClick={() => fetchDashboardData(true)} 
            className="admin-error-boundary__retry-btn"
            id="admin-dashboard-retry-btn"
          >
            <RefreshCw size={14} className="admin-error-boundary__retry-icon" />
            Retry Sync
          </button>
        </div>
      </div>
    )
  }

  // Destructure dynamic database payload (or use empty objects for skeleton support)
  const stats = data?.stats || {}
  const charts = data?.charts || {}
  const recentUsers = data?.recent_users || []
  const recentActivity = data?.recent_activity || []
  const systemHealth = data?.system_health || {}
  const databaseData = data?.database || {}
  const topSkills = data?.top_skills || []
  const feedbackData = data?.feedback || []
  const notificationsData = data?.notifications || []

  // Extract totals for visual displays on charts
  const totalUsersValue = stats?.total_users?.value || 0
  const totalUsersTrend = stats?.total_users?.trend || 0

  return (
    <div className="admin-dashboard-content">
      {/* Row 1: Hero Banner */}
      <HeroBanner onExport={handleExportData} />

      {/* Row 2: Statistics Grid (6 cards) */}
      <StatsGrid stats={stats} isLoading={isLoading} />

      {/* Row 3: Charts Group (Growth, Completion, Activity) */}
      <div className="admin-dashboard-charts-row">
        <UserGrowthChart 
          data={charts.user_growth} 
          totalValue={totalUsersValue}
          trend={totalUsersTrend}
          isLoading={isLoading} 
          period={period}
          onPeriodChange={setPeriod}
        />
        <TaskCompletionChart 
          data={charts.task_completion} 
          isLoading={isLoading} 
          period={period}
          onPeriodChange={setPeriod}
        />
        <WeeklyActivityChart 
          data={charts.weekly_activity} 
          isLoading={isLoading} 
          period={period}
          onPeriodChange={setPeriod}
        />
      </div>

      {/* Row 4: Lists & Metrics Group A */}
      <div className="admin-dashboard-metrics-row-4">
        <RecentUsers 
          users={recentUsers} 
          isLoading={isLoading} 
          onViewAll={() => handleNavigationRedirect('/admin/users')}
        />
        <RecentActivity 
          activities={recentActivity} 
          isLoading={isLoading} 
          onViewAll={() => handleNavigationRedirect('/admin/activity-logs')}
        />
        <SystemHealth 
          healthData={systemHealth} 
          responseTimeMs={responseTimeMs}
          isLoading={isLoading} 
        />
        <DatabaseOverview 
          databaseData={databaseData} 
          isLoading={isLoading} 
        />
      </div>

      {/* Row 5: Actions & Feedbacks Group B */}
      <div className="admin-dashboard-metrics-row-5">
        <TopSkills 
          skillsData={topSkills} 
          isLoading={isLoading} 
        />
        <LatestFeedback 
          feedbackData={feedbackData} 
          isLoading={isLoading} 
        />
        <Notifications 
          notificationsData={notificationsData} 
          isLoading={isLoading} 
        />
        <QuickActions 
          onActionSuccess={handleActionSuccess} 
        />
      </div>
    </div>
  )

  // Redirect link helper for list card actions
  function handleNavigationRedirect(path) {
    window.location.hash = path // fallback or custom router integration
    // Since react-router-dom is used, simple redirection or standard route event works.
    // If window.history is available:
    window.dispatchEvent(new PopStateEvent('popstate'))
    // Standard routing navigation can also be handled within buttons or window location.
    window.location.pathname = path
  }
}
