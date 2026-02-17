import pool from '../config/database.js'
import path from 'path'
import { getCache, setCache, clearCache } from '../utils/queryCache.js'

/**
 * Model Service - Business logic for model operations
 * Separates business logic from route handlers
 */
export const modelService = {
  /**
   * Get all models for a user (with caching and pagination)
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @param {number} options.page - Page number (default: 1)
   * @param {number} options.limit - Items per page (default: 50, max: 100)
   * @param {boolean} options.useCache - Whether to use cache (default: true)
   * @returns {Promise<Object>} Object with models array, pagination info
   */
  async getByUserId(userId, options = {}) {
    const { page = 1, limit = 50, useCache = true } = options
    const safeLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100) // Between 1 and 100
    const safePage = Math.max(parseInt(page) || 1, 1)
    const offset = (safePage - 1) * safeLimit
    
    const cacheKey = `models:user:${userId}:page:${safePage}:limit:${safeLimit}`
    
    // Check cache first
    if (useCache) {
      const cached = getCache(cacheKey)
      if (cached) return cached
    }
    
    // Get total count and paginated results
    const [countResult, dataResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM models WHERE user_id = $1', [userId]),
      pool.query(
        `SELECT m.*, p.name as project_name 
         FROM models m 
         LEFT JOIN projects p ON m.project_id = p.id 
         WHERE m.user_id = $1 
         ORDER BY m.created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, safeLimit, offset]
      )
    ])
    
    const total = parseInt(countResult.rows[0].total)
    const totalPages = Math.ceil(total / safeLimit)
    
    const result = {
      models: dataResult.rows,
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
   * Get a single model by ID
   * @param {number} id - Model ID
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<Object|null>} Model object or null if not found
   */
  async getById(id, userId) {
    const result = await pool.query(
      `SELECT m.*, p.name as project_name 
       FROM models m 
       LEFT JOIN projects p ON m.project_id = p.id 
       WHERE m.id = $1 AND m.user_id = $2`,
      [id, userId]
    )
    
    if (result.rows.length === 0) {
      return null
    }
    
    const model = result.rows[0]
    // Parse JSONB fields
    if (model.transform_matrix) {
      try {
        model.transform_matrix = typeof model.transform_matrix === 'string' 
          ? JSON.parse(model.transform_matrix) 
          : model.transform_matrix
      } catch (e) {
        model.transform_matrix = null
      }
    }
    if (model.metadata) {
      try {
        model.metadata = typeof model.metadata === 'string' 
          ? JSON.parse(model.metadata) 
          : model.metadata
      } catch (e) {
        model.metadata = null
      }
    }
    
    return model
    return result.rows[0] || null
  },

  /**
   * Create a new model
   * @param {Object} modelData - Model data
   * @returns {Promise<Object>} Created model
   */
  async create(modelData) {
    const { 
      name, description, file_path, file_size, file_type, project_id, user_id,
      crs, origin_lat, origin_lon, origin_altitude, transform_matrix, model_type, metadata
    } = modelData
    
    const result = await pool.query(
      `INSERT INTO models (name, description, file_path, file_size, file_type, project_id, user_id,
                          crs, origin_lat, origin_lon, origin_altitude, transform_matrix, model_type, metadata) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
       RETURNING *`,
      [
        name, description, file_path, file_size, file_type, project_id, user_id,
        crs || null, origin_lat || null, origin_lon || null, origin_altitude || null,
        transform_matrix ? JSON.stringify(transform_matrix) : null,
        model_type || 'static',
        metadata ? JSON.stringify(metadata) : null
      ]
    )
    
    // Clear cache for this user's models (all pages)
    clearCache(`models:user:${user_id}*`)
    
    return result.rows[0]
  },

  /**
   * Update a model
   * @param {number} id - Model ID
   * @param {number} userId - User ID (for authorization)
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated model or null if not found
   */
  async update(id, userId, updateData) {
    const { name, description, project_id } = updateData
    
    const result = await pool.query(
      `UPDATE models 
       SET name = $1, description = $2, project_id = $3, updated_at = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [name, description, project_id, id, userId]
    )
    
    // Clear cache for this user's models (all pages)
    if (result.rows[0]) {
      clearCache(`models:user:${userId}*`)
    }
    
    return result.rows[0] || null
  },

  /**
   * Delete a model
   * @param {number} id - Model ID
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<Object|null>} Deleted model info or null if not found
   */
  async delete(id, userId) {
    const result = await pool.query(
      'DELETE FROM models WHERE id = $1 AND user_id = $2 RETURNING id, file_path',
      [id, userId]
    )
    
    // Clear cache for this user's models (all pages)
    if (result.rows.length > 0) {
      clearCache(`models:user:${userId}*`)
    }
    
    return result.rows[0] || null
  },

  /**
   * Verify model belongs to user
   * @param {number} modelId - Model ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if model belongs to user
   */
  async verifyOwnership(modelId, userId) {
    const result = await pool.query(
      'SELECT id FROM models WHERE id = $1 AND user_id = $2',
      [modelId, userId]
    )
    return result.rows.length > 0
  },

  /**
   * Get model statistics for a user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Statistics object
   */
  async getStats(userId) {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_models,
        COALESCE(SUM(file_size), 0) as total_size,
        COUNT(DISTINCT file_type) as unique_types
       FROM models 
       WHERE user_id = $1`,
      [userId]
    )
    return result.rows[0]
  }
}
