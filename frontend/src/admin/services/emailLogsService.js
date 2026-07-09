import { apiClient } from '../../api'

export const adminEmailLogsService = {
  getEmailLogs: async ({ status = '', type = '', search = '', page = 1, limit = 50 } = {}) => {
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    if (type) params.append('type', type)
    if (search) params.append('search', search)
    params.append('page', page)
    params.append('limit', limit)
    const response = await apiClient.get(`/admin/email-logs/?${params.toString()}`)
    return response.data
  }
}
