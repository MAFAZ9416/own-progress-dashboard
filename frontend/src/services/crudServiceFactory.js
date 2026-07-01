import { apiClient } from '../api'

/**
 * Reusable CRUD API service factory helper.
 * Eliminates boilerplate code for standard DRF resource endpoints.
 *
 * @param {string} resourcePath - base resource path (e.g. '/skills/')
 */
export function createCrudService(resourcePath) {
  const normalizedPath = resourcePath.endsWith('/') ? resourcePath : `${resourcePath}/`

  return {
    getAll: async (params = {}) => {
      const { data } = await apiClient.get(normalizedPath, { params })
      return data
    },
    getById: async (id) => {
      const { data } = await apiClient.get(`${normalizedPath}${id}/`)
      return data
    },
    create: async (payload) => {
      const { data } = await apiClient.post(normalizedPath, payload)
      return data
    },
    update: async (id, payload) => {
      const { data } = await apiClient.patch(`${normalizedPath}${id}/`, payload)
      return data
    },
    remove: async (id) => {
      await apiClient.delete(`${normalizedPath}${id}/`)
    }
  }
}
