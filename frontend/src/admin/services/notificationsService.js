import { apiClient } from '../../api'

export const adminNotificationsService = {
  getNotificationsList: async () => {
    const response = await apiClient.get('/admin/notifications/')
    return response.data
  },
  sendNotificationAlert: async (data) => {
    const response = await apiClient.post('/admin/notifications/', data)
    return response.data
  }
}
