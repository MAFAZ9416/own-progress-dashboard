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

  // Chart Independent Period States
  const [userGrowthPeriod, setUserGrowthPeriod] = useState('month')
  const [taskPeriod, setTaskPeriod] = useState('month')
  const [activityPeriod, setActivityPeriod] = useState('month')

  // Chart Independent Data States
  const [userGrowthData, setUserGrowthData] = useState([])
  const [taskData, setTaskData] = useState([])
  const [activityData, setActivityData] = useState([])

  // Chart Independent Loading States
  const [isUserGrowthLoading, setIsUserGrowthLoading] = useState(false)
  const [isTaskLoading, setIsTaskLoading] = useState(false)
  const [isActivityLoading, setIsActivityLoading] = useState(false)

  const fetchDashboardData = useCallback(async (isInitial = true) => {
    setIsLoading(isInitial)
    setError(null)
    const startTime = performance.now()

    try {
      const result = await adminDashboardService.getDashboardSummary('month', isInitial)
      const endTime = performance.now()
      setResponseTimeMs(Math.round(endTime - startTime))
      console.log('--- DEBUG FRONTEND DASHBOARD SUMMARY RESPONSE ---', result)
      setData(result)
      setUserGrowthData(result.charts?.user_growth || [])
      setTaskData(result.charts?.task_completion || [])
      setActivityData(result.charts?.weekly_activity || [])
      
      // Reset period state selections back to default
      setUserGrowthPeriod('month')
      setTaskPeriod('month')
      setActivityPeriod('month')
    } catch (err) {
      console.error('Error fetching dashboard summary:', err)
      setError(err.response?.data?.message || err.message || 'Failed to connect to administrative server.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData(true)
  }, [fetchDashboardData])

  // 1. Fetch User Growth Chart when userGrowthPeriod changes
  useEffect(() => {
    if (!data) return
    
    let active = true
    const fetchUserGrowth = async () => {
      setIsUserGrowthLoading(true)
      try {
        const res = await adminDashboardService.getUserGrowthChart(userGrowthPeriod)
        console.log('--- DEBUG USER GROWTH CHART FETCH ---', res)
        if (active) {
          setUserGrowthData(res.user_growth || [])
        }
      } catch (err) {
        console.error('Error fetching user growth chart:', err)
      } finally {
        if (active) {
          setIsUserGrowthLoading(false)
        }
      }
    }
    
    fetchUserGrowth()
    return () => { active = false }
  }, [userGrowthPeriod])

  // 2. Fetch Task Completion Chart when taskPeriod changes
  useEffect(() => {
    if (!data) return
    
    let active = true
    const fetchTaskCompletion = async () => {
      setIsTaskLoading(true)
      try {
        const res = await adminDashboardService.getTaskCompletionChart(taskPeriod)
        console.log('--- DEBUG TASK COMPLETION CHART FETCH ---', res)
        if (active) {
          setTaskData(res.task_completion || [])
        }
      } catch (err) {
        console.error('Error fetching task completion chart:', err)
      } finally {
        if (active) {
          setIsTaskLoading(false)
        }
      }
    }
    
    fetchTaskCompletion()
    return () => { active = false }
  }, [taskPeriod])

  // 3. Fetch Activity Chart when activityPeriod changes
  useEffect(() => {
    if (!data) return
    
    let active = true
    const fetchActivity = async () => {
      setIsActivityLoading(true)
      try {
        const res = await adminDashboardService.getActivityChart(activityPeriod)
        console.log('--- DEBUG ACTIVITY CHART FETCH ---', res)
        if (active) {
          setActivityData(res.weekly_activity || [])
        }
      } catch (err) {
        console.error('Error fetching activity chart:', err)
      } finally {
        if (active) {
          setIsActivityLoading(false)
        }
      }
    }
    
    fetchActivity()
    return () => { active = false }
  }, [activityPeriod])

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
          data={userGrowthData} 
          totalValue={totalUsersValue}
          trend={totalUsersTrend}
          isLoading={isLoading || isUserGrowthLoading} 
          period={userGrowthPeriod}
          onPeriodChange={setUserGrowthPeriod}
        />
        <TaskCompletionChart 
          data={taskData} 
          isLoading={isLoading || isTaskLoading} 
          period={taskPeriod}
          onPeriodChange={setTaskPeriod}
        />
        <WeeklyActivityChart 
          data={activityData} 
          isLoading={isLoading || isActivityLoading} 
          period={activityPeriod}
          onPeriodChange={setActivityPeriod}
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
