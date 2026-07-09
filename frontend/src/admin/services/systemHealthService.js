import { apiClient } from '../../api'

export const adminSystemHealthService = {
  getSystemHealth: async () => {
    const response = await apiClient.get('/admin/health/')
    return response.data
  }
}
