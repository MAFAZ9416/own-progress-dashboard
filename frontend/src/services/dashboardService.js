import { apiClient } from '../api'

/**
 * dashboardService
 *
 * All endpoints consumed by the Dashboard page.
 *
 * Base URL: /api  (set in apiClient)
 * JWT token is injected automatically by the apiClient request interceptor.
 *
 * Endpoints:
 *   GET /api/dashboard/summary/   → KPI totals (skills, tasks, streaks)
 *   GET /api/dashboard/weekly/    → week-level activity counts
 *   GET /api/dashboard/monthly/   → month-level activity counts
 *   GET /api/dashboard/recent/    → recent activity feed items
 *   GET /api/dashboard/heatmap/   → 12-week grid of activity levels
 */
const dashboardService = {
  /**
   * GET /api/dashboard/summary/
   *
   * Expected response shape:
   * {
   *   total_skills:    number,
   *   total_tasks:     number,
   *   current_streak:  number,
   *   longest_streak:  number,
   *   tasks_done:      number,   // completed task count
   *   skills_change:   number,   // delta vs last period (e.g. +3)
   *   tasks_change:    number,
   * }
   */
  getSummary: async () => {
    const { data } = await apiClient.get('/dashboard/summary/')
    return data
  },

  /**
   * GET /api/dashboard/weekly/
   *
   * Expected response shape:
   * [
   *   { date: "2026-06-19", completed_tasks: 5 }
   * ]
   */
  getWeekly: async () => {
    const { data } = await apiClient.get('/dashboard/weekly/')
    return data
  },

  /**
   * GET /api/dashboard/monthly/
   *
   * Optional query param: ?year=2026
   *
   * Expected response shape:
   * {
   *   year: 2026,
   *   available_years: [2025, 2026],
   *   months: [
   *     { month: 1, completed_tasks: 12 },
   *     { month: 6, completed_tasks: 6 }
   *   ]
   * }
   */
  getMonthly: async (year) => {
    const params = year != null ? { year } : {}
    const { data } = await apiClient.get('/dashboard/monthly/', { params })
    return data
  },

  /**
   * GET /api/dashboard/recent/
   *
   * Expected response shape:
   * [
   *   {
   *     id:   number,
   *     type: "skill" | "task" | "streak",
   *     text: string,
   *     time: string,   // e.g. "2h ago" or ISO timestamp
   *   },
   *   ...
   * ]
   */
  getRecent: async () => {
    const { data } = await apiClient.get('/dashboard/recent/')
    return data
  },

  /**
   * GET /api/dashboard/heatmap/
   *
   * Expected response shape:
   * [
   *   { date: "2026-06-19", count: 5 }
   * ]
   */
  getHeatmap: async () => {
    const { data } = await apiClient.get('/dashboard/heatmap/')
    return data
  },

  /**
   * GET /api/tasks/ — fetched for all tasks
   */
  getTasks: async () => {
    const { data } = await apiClient.get('/tasks/')
    return data || []
  },

  /**
   * GET /api/tasks/ — fetched for pending tasks widget
   */
  getPendingTasks: async () => {
    const { data } = await apiClient.get('/tasks/')
    return (data || []).filter(task => task.status === 'pending')
  },

  /**
   * GET /api/skills/ — fetched for top skills widget
   */
  getSkills: async () => {
    const { data } = await apiClient.get('/skills/')
    return data || []
  },

  search: async (query) => {
    const { data } = await apiClient.get('/dashboard/search/', { params: { q: query } })
    return data || { results: [] }
  },

  exportData: async (format = 'json') => {
    const response = await apiClient.get('/dashboard/export/', {
      params: { format },
      responseType: format === 'csv' ? 'blob' : 'json',
    })
    return response
  },
}

export default dashboardService
