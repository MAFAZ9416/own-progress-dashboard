import { apiClient } from '../../api'

export const adminAnalyticsService = {
  getAnalytics: async (timeframe = 30) => {
    const response = await apiClient.get(`/admin/analytics/?timeframe=${timeframe}`)
    return response.data
  }
}
