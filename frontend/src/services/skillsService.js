import { apiClient } from '../api'

/**
 * skillsService
 *
 * CRUD operations for the Skills resource.
 */
const skillsService = {
  /** GET /skills — fetch all skills for the authenticated user */
  getAll: async () => {
    const { data } = await apiClient.get('/skills/')
    return data
  },

  /** GET /skills/:id */
  getById: async (id) => {
    const { data } = await apiClient.get(`/skills/${id}`)
    return data
  },

  /** POST /skills */
  create: async (payload) => {
    const { data } = await apiClient.post('/skills/', payload)
    return data
  },

  /** PATCH /skills/:id */
  update: async (id, payload) => {
    const { data } = await apiClient.patch(`/skills/${id}/`, payload)
    return data
  },

  /** DELETE /skills/:id */
  remove: async (id) => {
    await apiClient.delete(`/skills/${id}/`)
  },
}

export default skillsService
