import { apiClient } from '../../api'

export const adminDatabaseService = {
  getDatabaseOverview: async () => {
    const response = await apiClient.get('/admin/database/')
    return response.data
  }
}
