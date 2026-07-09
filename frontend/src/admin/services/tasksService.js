import { apiClient } from '../../api'

export const adminTasksService = {
  getTasksList: async (params) => {
    const response = await apiClient.get('/admin/tasks/', { params })
    return response.data
  },
  updateTask: async (id, data) => {
    const response = await apiClient.patch(`/admin/tasks/${id}/`, data)
    return response.data
  },
  deleteTask: async (id) => {
    const response = await apiClient.delete(`/admin/tasks/${id}/`)
    return response.data
  }
}
