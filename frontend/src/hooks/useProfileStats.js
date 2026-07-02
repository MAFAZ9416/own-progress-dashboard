import { useState, useEffect, useCallback } from 'react'
import dashboardService from '../services/dashboardService'

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
  } catch {
    return 'Recently'
  }
}

/**
 * Lightweight hook for Profile — fetches summary + recent only (2 requests).
 */
export function useProfileStats() {
  const [summary, setSummary] = useState(null)
  const [recent, setRecent] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStats = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [summaryData, recentData] = await Promise.all([
        dashboardService.getSummary(),
        dashboardService.getRecent(),
      ])

      const transformedRecent = (recentData || []).map((item, index) => ({
        id: index,
        type: 'task',
        text: `Completed "${item.task}" in ${item.skill}`,
        time: getRelativeTime(item.completed_at),
      }))

      setSummary(summaryData)
      setRecent(transformedRecent)
    } catch (err) {
      const msg =
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        err?.message ??
        'Failed to load profile stats.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { summary, recent, isLoading, error, refetch: fetchStats }
}
