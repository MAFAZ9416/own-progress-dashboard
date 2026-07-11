import { apiClient } from '../api'

const loginHistoryService = {
  /**
   * GET /api/users/login-history/
   * Returns the last 15 login records
   */
  getLoginHistory: async (params = {}) => {
    const { data } = await apiClient.get('/users/login-history/', { params })
    return data ?? []
  },
}

export default loginHistoryService
