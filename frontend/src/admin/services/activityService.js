import { apiClient } from '../../api'

export const adminActivityService = {
  getActivityLogs: async (params) => {
    const response = await apiClient.get('/admin/activity/', { params })
    return response.data
  }
}
