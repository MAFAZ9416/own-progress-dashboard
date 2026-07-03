import { apiClient } from '../../api'

/**
 * Admin Dashboard Services
 *
 * Integrates with Django admin API endpoints.
 * Authentication tokens are injected automatically by the apiClient.
 */
export const adminDashboardService = {
  /**
   * GET /api/admin/dashboard/
   * Retrieves the unified dashboard data (stats, charts, tables, system status).
   */
  getDashboardSummary: async () => {
    const response = await apiClient.get('/admin/dashboard/')
    return response.data
  },

  /**
   * POST /api/admin/action/
   * Triggers an administrative quick action (backup, report, announcement).
   */
  triggerQuickAction: async (actionType) => {
    const response = await apiClient.post('/admin/action/', { action_type: actionType })
    return response.data
  }
}
