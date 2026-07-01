import { apiClient } from '../api'
import { createCrudService } from './crudServiceFactory'

const baseService = createCrudService('/tasks')

/**
 * tasksService
 * CRUD operations and audit actions for the Tasks resource.
 */
const tasksService = {
  ...baseService,

  /** POST /tasks/:id/complete/ */
  complete: async (id) => {
    const { data } = await apiClient.post(`/tasks/${id}/complete/`)
    return data
  },

  /** POST /tasks/:id/reopen/ */
  reopen: async (id) => {
    const { data } = await apiClient.post(`/tasks/${id}/reopen/`)
    return data
  },

  /** GET /tasks/:id/history/ */
  getHistory: async (id) => {
    const { data } = await apiClient.get(`/tasks/${id}/history/`)
    return data
  },

  /** GET /tasks/:id/activity/ */
  getActivity: async (id) => {
    const { data } = await apiClient.get(`/tasks/${id}/activity/`)
    return data
  },
}

export default tasksService
