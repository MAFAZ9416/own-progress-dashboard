import { apiClient } from '../../api'

export const adminAchievementsService = {
  getAchievementsList: async () => {
    const response = await apiClient.get('/admin/achievements/')
    return response.data
  },
  createAchievement: async (data) => {
    const response = await apiClient.post('/admin/achievements/', data)
    return response.data
  },
  updateAchievement: async (id, data) => {
    const response = await apiClient.patch(`/admin/achievements/${id}/`, data)
    return response.data
  },
  deleteAchievement: async (id) => {
    const response = await apiClient.delete(`/admin/achievements/${id}/`)
    return response.data
  }
}
