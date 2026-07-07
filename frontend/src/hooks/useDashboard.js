import { useState, useEffect, useCallback } from 'react'
import dashboardService from '../services/dashboardService'

/**
 * useDashboard
 *
 * Fires all 5 dashboard API requests in parallel on mount.
 * Aggregates a single isLoading / error state so Dashboard.jsx
 * only needs one conditional to show skeletons or an error banner.
 *
 * Returns:
 *   {
 *     summary:   object | null,    ← /dashboard/summary/
 *     weekly:    array  | null,    ← /dashboard/weekly/
 *     monthly:   array  | null,    ← /dashboard/monthly/
 *     recent:    array  | null,    ← /dashboard/recent/
 *     heatmap:   array  | null,    ← /dashboard/heatmap/
 *     isLoading: boolean,
 *     error:     string | null,
 *     refetch:   () => void,       ← call to re-run all requests
 *   }
 */
// Helper to format relative time timezone-safely
function getRelativeTime(isoString) {
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now - date
    if (isNaN(diffMs)) return 'Recently'

    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  } catch (e) {
    return 'Recently'
  }
}

export function useDashboard() {
  const [summary,        setSummary]        = useState(null)
  const [weekly,         setWeekly]         = useState(null)
  const [monthly,        setMonthly]        = useState(null)
  const [monthlyYear,    setMonthlyYear]    = useState(new Date().getFullYear())
  const [availableYears, setAvailableYears] = useState([new Date().getFullYear()])
  const [recent,         setRecent]         = useState(null)
  const [heatmap,        setHeatmap]        = useState(null)
  const [tasks,          setTasks]          = useState([])
  const [pendingTasks,   setPendingTasks]   = useState([])
  const [skills,         setSkills]         = useState([])
  const [topSkills,      setTopSkills]      = useState([])
  const [recentAchievements, setRecentAchievements] = useState([])
  const [achievements,   setAchievements]   = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [profileCompletion, setProfileCompletion] = useState(0)
  const [profileSuggestions, setProfileSuggestions] = useState([])
  const [streakHistory,   setStreakHistory]   = useState([])
  const [isLoading,      setIsLoading]      = useState(true)
  const [error,          setError]          = useState(null)

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Run all requests concurrently — fail-fast on any rejection
      const [summaryData, weeklyData, monthlyData, recentData, heatmapData, tasksData, skillsData] =
        await Promise.all([
          dashboardService.getSummary(),
          dashboardService.getWeekly(),
          dashboardService.getMonthly(),
          dashboardService.getRecent(),
          dashboardService.getHeatmap(),
          dashboardService.getTasks(),
          dashboardService.getSkills(),
        ])

      const pendingTasksData = (tasksData || []).filter(task => task?.status?.toLowerCase() !== 'completed')

      // 1. Transform Weekly Data (ensure all 7 days of the current week exist)
      const daysOfWeekShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const transformedWeekly = Array.from({ length: 7 }).map((_, i) => {
        const cellDate = new Date(today)
        cellDate.setDate(today.getDate() - (6 - i))

        const year = cellDate.getFullYear()
        const month = String(cellDate.getMonth() + 1).padStart(2, '0')
        const day = String(cellDate.getDate()).padStart(2, '0')
        const dateStr = `${year}-${month}-${day}`

        const match = (weeklyData || []).find(item => item.date === dateStr)
        const dayName = daysOfWeekShort[cellDate.getDay()]
        return {
          day: dayName,
          count: match ? (match.completed_tasks ?? 0) : 0,
          tasksDone: match ? (match.completed_tasks ?? 0) : 0
        }
      })

      // 2. Transform Monthly Data (backend now returns { year, available_years, months })
      const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const monthlyPayload = monthlyData || {}
      const transformedMonthly = (monthlyPayload.months || []).map(item => ({
        month: monthsShort[(item.month ?? 1) - 1],
        count: item.completed_tasks ?? 0,
      }))

      // 3. Transform Heatmap Data (convert daily list to 12 weeks × 7 days matrix)
      const dayOfWeek = today.getDay()
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      const currentMonday = new Date(today)
      currentMonday.setDate(today.getDate() - daysToMonday)
      currentMonday.setHours(0, 0, 0, 0)

      const transformedHeatmap = Array.from({ length: 12 }).map((_, weekIndex) => {
        const weekStart = new Date(currentMonday)
        weekStart.setDate(currentMonday.getDate() - (11 - weekIndex) * 7)

        return Array.from({ length: 7 }).map((_, dayIndex) => {
          const cellDate = new Date(weekStart)
          cellDate.setDate(weekStart.getDate() + dayIndex)

          const year = cellDate.getFullYear()
          const month = String(cellDate.getMonth() + 1).padStart(2, '0')
          const day = String(cellDate.getDate()).padStart(2, '0')
          const dateStr = `${year}-${month}-${day}`

          const match = (heatmapData || []).find(item => item.date === dateStr)
          if (match) {
            const count = match.count || 0
            if (count === 0) return 0
            if (count <= 2) return 1
            if (count <= 4) return 2
            if (count <= 6) return 3
            return 4
          }
          return 0
        })
      })

      // 4. Transform Recent Activity Feed
      const transformedRecent = (recentData || []).map((item, index) => ({
        id: index,
        type: 'task',
        text: `Completed "${item.task}" in ${item.skill}`,
        time: getRelativeTime(item.completed_at)
      }))

      // 5. Sort Skills for Top Skills Widget (Progress descending, limit to top 5)
      // Calculate progress if backend doesn't provide it (progress, completion_percentage, etc.)
      const transformedSkills = (skillsData || []).map(skill => {
        let progressVal = skill.progress ?? skill.completion_percentage
        if (progressVal === undefined || progressVal === null) {
          const completedCount = (tasksData || []).filter(
            t => t.skill === skill.id && t.status === 'completed'
          ).length
          progressVal = skill.target_tasks > 0
            ? Math.round((completedCount / skill.target_tasks) * 100)
            : 0
        }
        return {
          ...skill,
          progress: Math.min(progressVal, 100)
        }
      })

      const sortedSkills = [...transformedSkills]
        .sort((a, b) => b.progress - a.progress)
        .slice(0, 5)

      setSummary(summaryData)
      setWeekly(transformedWeekly)
      setMonthly(transformedMonthly)
      setMonthlyYear(monthlyPayload.year ?? new Date().getFullYear())
      setAvailableYears(monthlyPayload.available_years ?? [new Date().getFullYear()])
      setRecent(transformedRecent)
      setHeatmap(transformedHeatmap)
      setTasks(tasksData || [])
      setPendingTasks((tasksData || []).filter(task => task.status !== 'completed'))
      setSkills(transformedSkills)
      setTopSkills(sortedSkills)
      setRecentAchievements(summaryData?.recent_achievements ?? [])
      setAchievements(summaryData?.achievements ?? [])
      setRecentActivities(summaryData?.recent_activities ?? [])
      setProfileCompletion(summaryData?.profile_completion ?? 0)
      setProfileSuggestions(summaryData?.profile_suggestions ?? [])
      setStreakHistory(summaryData?.streak_history ?? [])
    } catch (err) {
      // Extract the most useful error message available
      const msg =
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        err?.message ??
        'Failed to load dashboard data. Please try again.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fire on mount
  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  /**
   * Change the year for the monthly chart without re-fetching everything.
   * @param {number} year
   */
  const changeMonthlyYear = useCallback(async (year) => {
    try {
      const monthlyData = await dashboardService.getMonthly(year)
      const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const payload = monthlyData || {}
      const transformed = (payload.months || []).map(item => ({
        month: monthsShort[(item.month ?? 1) - 1],
        count: item.completed_tasks ?? 0,
      }))
      setMonthly(transformed)
      setMonthlyYear(payload.year ?? year)
      setAvailableYears(payload.available_years ?? [year])
    } catch (err) {
      // Silently keep the current data on error
      console.error('Failed to fetch monthly data for year', year, err)
    }
  }, [])

  return {
    summary,
    weekly,
    monthly,
    monthlyYear,
    availableYears,
    changeMonthlyYear,
    recent,
    heatmap,
    tasks,
    pendingTasks,
    skills,
    topSkills,
    recentAchievements,
    achievements,
    recentActivities,
    profileCompletion,
    profileSuggestions,
    streakHistory,
    isLoading,
    error,
    refetch: fetchAll
  }
}
