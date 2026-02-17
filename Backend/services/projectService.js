import pool from '../config/database.js'
import { getCache, setCache, clearCache } from '../utils/queryCache.js'

/**
 * Project Service - Business logic for project operations
 */
export const projectService = {
  /**
   * Get all projects for a user (with caching and pagination)
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @param {number} options.page - Page number (default: 1)
   * @param {number} options.limit - Items per page (default: 50, max: 100)
   * @param {boolean} options.useCache - Whether to use cache (default: true)
   * @returns {Promise<Object>} Object with projects array, pagination info
   */
  async getByUserId(userId, options = {}) {
    const { page = 1, limit = 50, useCache = true } = options
    const safeLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100) // Between 1 and 100
    const safePage = Math.max(parseInt(page) || 1, 1)
    const offset = (safePage - 1) * safeLimit
    
    const cacheKey = `projects:user:${userId}:page:${safePage}:limit:${safeLimit}`
    
    // Check cache first
    if (useCache) {
      const cached = getCache(cacheKey)
      if (cached) return cached
    }
    
    // Get total count and paginated results
    const [countResult, dataResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM projects WHERE user_id = $1', [userId]),
      pool.query(
        'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [userId, safeLimit, offset]
      )
    ])
    
    const total = parseInt(countResult.rows[0].total)
    const totalPages = Math.ceil(total / safeLimit)
    
    const result = {
      projects: dataResult.rows,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
        hasNext: safePage < totalPages,
        hasPrev: safePage > 1
      }
    }
    
    // Cache the result
    if (useCache) {
      setCache(cacheKey, result, 2 * 60 * 1000) // 2 minutes cache
    }
    
    return result
  },

  /**
   * Get a single project by ID
   * @param {number} id - Project ID
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<Object|null>} Project object or null if not found
   */
  async getById(id, userId) {
    const result = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [id, userId]
    )
    return result.rows[0] || null
  },

  /**
   * Create a new project
   * @param {Object} projectData - Project data
   * @returns {Promise<Object>} Created project
   */
  async create(projectData) {
    const { name, description, user_id } = projectData
    
    const result = await pool.query(
      'INSERT INTO projects (name, description, user_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description || null, user_id]
    )
    
    // Clear cache for this user's projects (all pages)
    clearCache(`projects:user:${user_id}*`)
    
    return result.rows[0]
  },

  /**
   * Update a project
   * @param {number} id - Project ID
   * @param {number} userId - User ID (for authorization)
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated project or null if not found
   */
  async update(id, userId, updateData) {
    const { name, description, status } = updateData
    
    const result = await pool.query(
      'UPDATE projects SET name = $1, description = $2, status = $3, updated_at = NOW() WHERE id = $4 AND user_id = $5 RETURNING *',
      [name, description, status, id, userId]
    )
    
    // Clear cache for this user's projects (all pages)
    if (result.rows[0]) {
      clearCache(`projects:user:${userId}*`)
    }
    
    return result.rows[0] || null
  },

  /**
   * Delete a project
   * @param {number} id - Project ID
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id, userId) {
    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    )
    
    // Clear cache for this user's projects (all pages)
    if (result.rows.length > 0) {
      clearCache(`projects:user:${userId}*`)
    }
    
    return result.rows.length > 0
  },

  /**
   * Verify project belongs to user
   * @param {number} projectId - Project ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if project belongs to user
   */
  async verifyOwnership(projectId, userId) {
    const result = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, userId]
    )
    return result.rows.length > 0
  }
}
