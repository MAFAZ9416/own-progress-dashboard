import { apiClient } from '../../api'

export const adminBackupsService = {
  getBackups: async (params) => {
    const response = await apiClient.get('/admin/backups/', { params })
    return response.data
  },
  createBackup: async () => {
    const response = await apiClient.post('/admin/backups/', {})
    return response.data
  },
  getDownloadUrl: (backupId) => {
    const baseURL = apiClient.defaults.baseURL || ''
    return `${baseURL}/admin/backups/${backupId}/download/`
  }
}
