import { apiClient } from '../../api'

export const adminReportsService = {
  getReportsAnalytics: async (params) => {
    const response = await apiClient.get('/admin/reports/', { params })
    return response.data
  }
}
