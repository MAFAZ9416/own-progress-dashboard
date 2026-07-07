import { apiClient } from '../api'

const achievementsService = {
  /**
   * GET /api/dashboard/achievements/
   * Returns all achievements with per-user unlock status and progress
   */
  getAchievements: async () => {
    const { data } = await apiClient.get('/dashboard/achievements/')
    return data?.achievements ?? []
  },
}

export default achievementsService
