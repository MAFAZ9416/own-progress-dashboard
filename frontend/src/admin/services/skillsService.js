import { apiClient } from '../../api'

/**
 * Admin Skills Management Services
 */
export const adminSkillsService = {
  getSkillsList: async (params) => {
    const response = await apiClient.get('/admin/skills/list/', { params })
    return response.data
  },

  getSkillGroupDetail: async (name) => {
    const response = await apiClient.get('/admin/skills/group-detail/', { params: { name } })
    return response.data
  },

  globalEditSkill: async (old_name, new_name, color) => {
    const response = await apiClient.patch('/admin/skills/global-edit/', { old_name, new_name, color })
    return response.data
  },

  globalDeleteSkill: async (name) => {
    const response = await apiClient.delete('/admin/skills/global-delete/', { params: { name } })
    return response.data
  },

  createSkill: async (payload) => {
    const response = await apiClient.post('/admin/skills/create/', payload)
    return response.data
  }
}
