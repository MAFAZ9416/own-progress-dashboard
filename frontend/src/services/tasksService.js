import { apiClient } from '../api'

/**
 * tasksService
 *
 * CRUD operations for the Tasks resource.
 */
const tasksService = {
  /** GET /tasks — fetch all tasks for the authenticated user */
  getAll: async (filters = {}) => {
    const { data } = await apiClient.get('/tasks/', { params: filters })
    return data
  },

  /** GET /tasks/:id */
  getById: async (id) => {
    const { data } = await apiClient.get(`/tasks/${id}`)
    return data
  },

  /** POST /tasks */
  create: async (payload) => {
    const { data } = await apiClient.post('/tasks/', payload)
    return data
  },

  /** PATCH /tasks/:id */
  update: async (id, payload) => {
    const { data } = await apiClient.patch(`/tasks/${id}/`, payload)
    return data
  },

  /** DELETE /tasks/:id */
  remove: async (id) => {
    await apiClient.delete(`/tasks/${id}`)
  },
}

export default tasksService
