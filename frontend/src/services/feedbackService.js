import { apiClient } from '../api'

const feedbackService = {
  /**
   * Send feedback & suggestions.
   *
   * POST /api/users/feedback/
   * Body: { name (opt), email (opt), message (req) }
   * Returns { message: "Feedback sent successfully." }
   *
   * @param {{ name?: string, email?: string, message: string }} data
   * @returns {Promise<object>}
   */
  sendFeedback: async (data) => {
    const response = await apiClient.post('/users/feedback/', data)
    return response.data
  },
}

export default feedbackService
