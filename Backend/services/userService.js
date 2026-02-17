import pool from '../config/database.js'

/**
 * User Service - Business logic for user operations
 */
export const userService = {
  /**
   * Get user profile by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} User object or null if not found
   */
  async getProfile(userId) {
    const result = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [userId]
    )
    return result.rows[0] || null
  },

  /**
   * Update user profile
   * @param {number} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated user or null if not found
   */
  async updateProfile(userId, updateData) {
    const { name, email } = updateData
    
    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2, updated_at = NOW() WHERE id = $3 RETURNING id, name, email, created_at',
      [name, email, userId]
    )
    return result.rows[0] || null
  },

  /**
   * Get user statistics
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Statistics object
   */
  async getStats(userId) {
    const [projectsResult, modelsResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM projects WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*) as count, SUM(file_size) as total_size FROM models WHERE user_id = $1', [userId]),
    ])

    return {
      totalProjects: parseInt(projectsResult.rows[0].count),
      totalModels: parseInt(modelsResult.rows[0].count),
      totalStorage: parseInt(modelsResult.rows[0].total_size || 0),
    }
  }
}
