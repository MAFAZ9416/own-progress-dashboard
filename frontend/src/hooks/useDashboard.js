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
export function useDashboard() {
  const [summary,   setSummary]   = useState(null)
  const [weekly,    setWeekly]    = useState(null)
  const [monthly,   setMonthly]   = useState(null)
  const [recent,    setRecent]    = useState(null)
  const [heatmap,   setHeatmap]   = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState(null)

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Run all requests concurrently — fail-fast on any rejection
      const [summaryData, weeklyData, monthlyData, recentData, heatmapData] =
        await Promise.all([
          dashboardService.getSummary(),
          dashboardService.getWeekly(),
          dashboardService.getMonthly(),
          dashboardService.getRecent(),
          dashboardService.getHeatmap(),
        ])

      setSummary(summaryData)
      setWeekly(weeklyData)
      setMonthly(monthlyData)
      setRecent(recentData)
      setHeatmap(heatmapData)
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

  return { summary, weekly, monthly, recent, heatmap, isLoading, error, refetch: fetchAll }
}
