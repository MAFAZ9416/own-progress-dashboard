import { apiClient } from '../../api'

export const adminFeedbackService = {
  getFeedbackList: async (params) => {
    const response = await apiClient.get('/admin/feedback/', { params })
    return response.data
  },
  updateFeedbackStatus: async (id, data) => {
    const response = await apiClient.patch(`/admin/feedback/${id}/`, data)
    return response.data
  },
  replyFeedback: async (id, data) => {
    const response = await apiClient.post(`/admin/feedback/${id}/reply/`, data)
    return response.data
  }
}
