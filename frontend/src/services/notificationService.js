import { apiClient } from '../api'

const notificationService = {
  getNotifications: async () => {
    const { data } = await apiClient.get('/notifications/')
    return data || []
  },

  markAsRead: async (id) => {
    const { data } = await apiClient.post(`/notifications/${id}/read/`)
    return data
  },

  markAllAsRead: async () => {
    const { data } = await apiClient.post('/notifications/read-all/')
    return data
  },

  deleteNotification: async (id) => {
    await apiClient.delete(`/notifications/${id}/`)
  },
}

export default notificationService
