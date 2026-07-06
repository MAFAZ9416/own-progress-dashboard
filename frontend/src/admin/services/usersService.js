import { apiClient } from '../../api'

/**
 * Admin User Management Services
 */
export const adminUsersService = {
  createUser: async (data) => {
    const config = {}
    if (data instanceof FormData) {
      config.headers = { 'Content-Type': 'multipart/form-data' }
    }
    const response = await apiClient.post('/admin/users/create/', data, config)
    return response.data
  },

  changeUserPassword: async (id, data) => {
    const response = await apiClient.post(`/admin/users/${id}/change-password/`, data)
    return response.data
  },

  getUsersList: async (params) => {
    const response = await apiClient.get('/admin/users/', { params })
    return response.data
  },

  getUserDetail: async (id) => {
    const response = await apiClient.get(`/admin/users/${id}/`)
    return response.data
  },

  updateUser: async (id, data) => {
    const config = {}
    if (data instanceof FormData) {
      config.headers = { 'Content-Type': 'multipart/form-data' }
    }
    const response = await apiClient.patch(`/admin/users/${id}/`, data, config)
    return response.data
  },

  deleteUser: async (id) => {
    const response = await apiClient.delete(`/admin/users/${id}/`)
    return response.data
  },

  updateUserSkill: async (id, data) => {
    const response = await apiClient.patch(`/admin/skills/${id}/`, data)
    return response.data
  },

  deleteUserSkill: async (id) => {
    const response = await apiClient.delete(`/admin/skills/${id}/`)
    return response.data
  },

  updateUserTask: async (id, data) => {
    const response = await apiClient.patch(`/admin/tasks/${id}/`, data)
    return response.data
  },

  deleteUserTask: async (id) => {
    const response = await apiClient.delete(`/admin/tasks/${id}/`)
    return response.data
  },
}
