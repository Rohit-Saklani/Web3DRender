import pool from '../config/database.js'
import { getCache, setCache, clearCache } from '../utils/queryCache.js'

/**
 * Annotation Service - Business logic for annotation operations
 */
export const annotationService = {
  /**
   * Get all annotations for a model (with caching)
   * @param {number} modelId - Model ID
   * @param {boolean} useCache - Whether to use cache (default: true)
   * @returns {Promise<Array>} Array of annotations with images
   */
  async getByModelId(modelId, useCache = true) {
    const cacheKey = `annotations:model:${modelId}`
    
    // Check cache first
    if (useCache) {
      const cached = getCache(cacheKey)
      if (cached) return cached
    }
    
    const result = await pool.query(
      `SELECT 
        a.*,
        COUNT(ai.id) as image_count,
        json_agg(
          json_build_object(
            'id', ai.id,
            'image_path', ai.image_path,
            'image_name', ai.image_name,
            'image_identifier', ai.image_identifier,
            'thumbnail_path', ai.thumbnail_path,
            'display_order', ai.display_order
          ) ORDER BY ai.display_order
        ) FILTER (WHERE ai.id IS NOT NULL) as images
       FROM annotations a
       LEFT JOIN annotation_images ai ON a.id = ai.annotation_id
       WHERE a.model_id = $1
       GROUP BY a.id
       ORDER BY a.created_at DESC`,
      [modelId]
    )

    // Clean up the images array (remove null entries)
    const annotations = result.rows.map(row => ({
      ...row,
      images: row.images || []
    }))
    
    // Cache the result
    if (useCache) {
      setCache(cacheKey, annotations, 3 * 60 * 1000) // 3 minutes cache
    }
    
    return annotations
  },

  /**
   * Get a single annotation by ID
   * @param {number} id - Annotation ID
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<Object|null>} Annotation object or null if not found
   */
  async getById(id, userId) {
    const result = await pool.query(
      `SELECT 
        a.*,
        json_agg(
          json_build_object(
            'id', ai.id,
            'image_path', ai.image_path,
            'image_name', ai.image_name,
            'image_identifier', ai.image_identifier,
            'thumbnail_path', ai.thumbnail_path,
            'camera_position_x', ai.camera_position_x,
            'camera_position_y', ai.camera_position_y,
            'camera_position_z', ai.camera_position_z,
            'display_order', ai.display_order
          ) ORDER BY ai.display_order
        ) FILTER (WHERE ai.id IS NOT NULL) as images
       FROM annotations a
       LEFT JOIN annotation_images ai ON a.id = ai.annotation_id
       WHERE a.id = $1 AND a.user_id = $2
       GROUP BY a.id`,
      [id, userId]
    )

    if (result.rows.length === 0) {
      return null
    }

    return {
      ...result.rows[0],
      images: result.rows[0].images || []
    }
  },

  /**
   * Create a new annotation
   * @param {Object} annotationData - Annotation data
   * @returns {Promise<Object>} Created annotation
   */
  async create(annotationData) {
    const {
      model_id,
      user_id,
      title,
      description,
      position_x,
      position_y,
      position_z,
      normal_x,
      normal_y,
      normal_z,
      color,
      annotation_type,
      measurement_value,
      measurement_unit,
      priority,
    } = annotationData

    const result = await pool.query(
      `INSERT INTO annotations (
        model_id, user_id, title, description, 
        position_x, position_y, position_z,
        normal_x, normal_y, normal_z,
        color, annotation_type, measurement_value, measurement_unit, priority, created_by,
        latitude, longitude, altitude, georeferenced
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`,
      [
        model_id,
        user_id,
        title || null,
        description || null,
        position_x,
        position_y,
        position_z,
        normal_x || null,
        normal_y || null,
        normal_z || null,
        color || '#FF0000',
        annotation_type || 'marker',
        measurement_value || null,
        measurement_unit || 'm',
        priority || 'normal',
        user_id,
        latitude || null,
        longitude || null,
        altitude || null,
        georeferenced || false,
      ]
    )
    
    // Clear cache for this model's annotations
    clearCache(`annotations:model:${model_id}`)
    
    return result.rows[0]
  },

  /**
   * Update an annotation
   * @param {number} id - Annotation ID
   * @param {number} userId - User ID (for authorization)
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated annotation or null if not found
   */
  async update(id, userId, updateData) {
    // Get model_id first (before update, in case update fails)
    const modelCheck = await pool.query(
      'SELECT model_id FROM annotations WHERE id = $1 AND user_id = $2',
      [id, userId]
    )
    
    if (modelCheck.rows.length === 0) {
      return null
    }
    
    const model_id = modelCheck.rows[0].model_id

    const {
      title,
      description,
      position_x,
      position_y,
      position_z,
      color,
      status,
      priority,
      measurement_value,
      measurement_unit,
    } = updateData

    const result = await pool.query(
      `UPDATE annotations 
       SET title = $1, description = $2, position_x = $3, position_y = $4, position_z = $5,
           color = $6, status = $7, priority = $8, measurement_value = $9, measurement_unit = $10,
           updated_at = NOW()
       WHERE id = $11 AND user_id = $12
       RETURNING *`,
      [
        title,
        description,
        position_x,
        position_y,
        position_z,
        color,
        status,
        priority,
        measurement_value,
        measurement_unit,
        id,
        userId,
      ]
    )
    
    // Clear cache for this model's annotations
    if (result.rows[0]) {
      clearCache(`annotations:model:${model_id}`)
    }
    
    return result.rows[0] || null
  },

  /**
   * Delete an annotation
   * @param {number} id - Annotation ID
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id, userId) {
    // Get model_id before deleting for cache clearing
    const annotation = await pool.query('SELECT model_id FROM annotations WHERE id = $1 AND user_id = $2', [id, userId])
    
    const result = await pool.query(
      'DELETE FROM annotations WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    )
    
    // Clear cache if deleted
    if (result.rows.length > 0 && annotation.rows[0]) {
      clearCache(`annotations:model:${annotation.rows[0].model_id}`)
    }
    
    return result.rows.length > 0
  },

  /**
   * Verify annotation belongs to user
   * @param {number} annotationId - Annotation ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if annotation belongs to user
   */
  async verifyOwnership(annotationId, userId) {
    const result = await pool.query(
      'SELECT id FROM annotations WHERE id = $1 AND user_id = $2',
      [annotationId, userId]
    )
    return result.rows.length > 0
  }
}
