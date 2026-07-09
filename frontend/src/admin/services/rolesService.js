import { apiClient } from '../../api'

export const adminRolesService = {
  getRoles: async () => {
    const response = await apiClient.get('/admin/roles/')
    return response.data
  },
  updateRole: async (userId, data) => {
    const response = await apiClient.patch(`/admin/roles/${userId}/`, data)
    return response.data
  }
}
