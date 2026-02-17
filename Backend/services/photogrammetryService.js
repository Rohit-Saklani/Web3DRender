import pool from '../config/database.js'
import { getCache, setCache, clearCache } from '../utils/queryCache.js'

/**
 * Photogrammetry Service - Handles photogrammetry projects and camera calibration
 * Separates business logic from route handlers
 */
export const photogrammetryService = {
  /**
   * Create a photogrammetry project
   * @param {number} modelId - Model ID
   * @param {number} userId - User ID
   * @param {Object} settings - Project settings
   * @returns {Promise<Object>} Created project
   */
  async createProject(modelId, userId, settings) {
    const {
      project_id,
      reconstruction_method,
      quality_settings,
      input_images_count
    } = settings
    
    // Verify model ownership
    const modelCheck = await pool.query(
      'SELECT id FROM models WHERE id = $1 AND user_id = $2',
      [modelId, userId]
    )
    
    if (modelCheck.rows.length === 0) {
      throw new Error('Model not found or access denied')
    }
    
    const result = await pool.query(
      `INSERT INTO photogrammetry_projects 
       (model_id, project_id, user_id, reconstruction_method, quality_settings, 
        input_images_count, processing_status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [
        modelId,
        project_id || null,
        userId,
        reconstruction_method || 'SfM',
        quality_settings ? JSON.stringify(quality_settings) : null,
        input_images_count || 0
      ]
    )
    
    return result.rows[0]
  },

  /**
   * Get photogrammetry project by ID
   * @param {number} projectId - Project ID
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<Object|null>} Project or null
   */
  async getProjectById(projectId, userId) {
    const result = await pool.query(
      `SELECT pp.*, m.name as model_name, m.file_path as model_path
       FROM photogrammetry_projects pp
       JOIN models m ON pp.model_id = m.id
       WHERE pp.id = $1 AND pp.user_id = $2`,
      [projectId, userId]
    )
    
    if (result.rows.length === 0) {
      return null
    }
    
    const row = result.rows[0]
    return {
      ...row,
      quality_settings: row.quality_settings ? JSON.parse(row.quality_settings) : null
    }
  },

  /**
   * Get all photogrammetry projects for a model
   * @param {number} modelId - Model ID
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<Array>} Array of projects
   */
  async getProjectsByModelId(modelId, userId) {
    // Verify model ownership
    const modelCheck = await pool.query(
      'SELECT id FROM models WHERE id = $1 AND user_id = $2',
      [modelId, userId]
    )
    
    if (modelCheck.rows.length === 0) {
      return []
    }
    
    const result = await pool.query(
      `SELECT * FROM photogrammetry_projects 
       WHERE model_id = $1 AND user_id = $2
       ORDER BY created_at DESC`,
      [modelId, userId]
    )
    
    return result.rows.map(row => ({
      ...row,
      quality_settings: row.quality_settings ? JSON.parse(row.quality_settings) : null
    }))
  },

  /**
   * Update photogrammetry project status
   * @param {number} projectId - Project ID
   * @param {number} userId - User ID (for authorization)
   * @param {Object} updateData - Update data
   * @returns {Promise<Object|null>} Updated project or null
   */
  async updateProject(projectId, userId, updateData) {
    const {
      processing_status,
      output_mesh_path,
      processing_log
    } = updateData
    
    const result = await pool.query(
      `UPDATE photogrammetry_projects 
       SET processing_status = COALESCE($1, processing_status),
           output_mesh_path = COALESCE($2, output_mesh_path),
           processing_log = COALESCE($3, processing_log),
           updated_at = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [processing_status, output_mesh_path, processing_log, projectId, userId]
    )
    
    return result.rows[0] || null
  },

  /**
   * Update camera calibration parameters
   * @param {number} cameraId - Camera viewpoint ID
   * @param {number} userId - User ID (for authorization)
   * @param {Object} calibrationData - Calibration data
   * @returns {Promise<Object|null>} Updated camera or null
   */
  async updateCameraCalibration(cameraId, userId, calibrationData) {
    const {
      calibration_matrix,
      distortion_coefficients,
      focal_length,
      sensor_width,
      sensor_height,
      image_width,
      image_height
    } = calibrationData
    
    // Verify camera ownership through model
    const cameraCheck = await pool.query(
      `SELECT cv.id FROM camera_viewpoints cv
       JOIN models m ON cv.model_id = m.id
       WHERE cv.id = $1 AND m.user_id = $2`,
      [cameraId, userId]
    )
    
    if (cameraCheck.rows.length === 0) {
      return null
    }
    
    const result = await pool.query(
      `UPDATE camera_viewpoints 
       SET calibration_matrix = COALESCE($1, calibration_matrix),
           distortion_coefficients = COALESCE($2, distortion_coefficients),
           focal_length = COALESCE($3, focal_length),
           sensor_width = COALESCE($4, sensor_width),
           sensor_height = COALESCE($5, sensor_height),
           image_width = COALESCE($6, image_width),
           image_height = COALESCE($7, image_height)
       WHERE id = $8
       RETURNING *`,
      [
        calibration_matrix ? JSON.stringify(calibration_matrix) : null,
        distortion_coefficients ? JSON.stringify(distortion_coefficients) : null,
        focal_length || null,
        sensor_width || null,
        sensor_height || null,
        image_width || null,
        image_height || null,
        cameraId
      ]
    )
    
    return result.rows[0] || null
  }
}
