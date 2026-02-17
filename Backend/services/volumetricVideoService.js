import pool from '../config/database.js'
import { getCache, setCache, clearCache } from '../utils/queryCache.js'

/**
 * Volumetric Video Service - Handles volumetric video sequences and frames
 * Separates business logic from route handlers
 */
export const volumetricVideoService = {
  /**
   * Create a volumetric video record
   * @param {number} modelId - Model ID
   * @param {number} userId - User ID
   * @param {Object} videoData - Video data
   * @returns {Promise<Object>} Created video record
   */
  async createVideo(modelId, userId, videoData) {
    const {
      video_path,
      frame_count,
      fps,
      resolution_width,
      resolution_height,
      format,
      metadata
    } = videoData
    
    // Verify model ownership
    const modelCheck = await pool.query(
      'SELECT id FROM models WHERE id = $1 AND user_id = $2',
      [modelId, userId]
    )
    
    if (modelCheck.rows.length === 0) {
      throw new Error('Model not found or access denied')
    }
    
    const result = await pool.query(
      `INSERT INTO volumetric_videos 
       (model_id, user_id, video_path, frame_count, fps, resolution_width, 
        resolution_height, format, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        modelId,
        userId,
        video_path,
        frame_count || null,
        fps || null,
        resolution_width || null,
        resolution_height || null,
        format || 'PLY_SEQUENCE',
        metadata ? JSON.stringify(metadata) : null
      ]
    )
    
    return result.rows[0]
  },

  /**
   * Get volumetric video by ID
   * @param {number} videoId - Video ID
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<Object|null>} Video or null
   */
  async getVideoById(videoId, userId) {
    const result = await pool.query(
      `SELECT vv.*, m.name as model_name, m.file_path as model_path
       FROM volumetric_videos vv
       JOIN models m ON vv.model_id = m.id
       WHERE vv.id = $1 AND vv.user_id = $2`,
      [videoId, userId]
    )
    
    if (result.rows.length === 0) {
      return null
    }
    
    const row = result.rows[0]
    return {
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null
    }
  },

  /**
   * Get volumetric video by model ID
   * @param {number} modelId - Model ID
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<Object|null>} Video or null
   */
  async getVideoByModelId(modelId, userId) {
    // Verify model ownership
    const modelCheck = await pool.query(
      'SELECT id FROM models WHERE id = $1 AND user_id = $2',
      [modelId, userId]
    )
    
    if (modelCheck.rows.length === 0) {
      return null
    }
    
    const result = await pool.query(
      `SELECT * FROM volumetric_videos 
       WHERE model_id = $1 AND user_id = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [modelId, userId]
    )
    
    if (result.rows.length === 0) {
      return null
    }
    
    const row = result.rows[0]
    return {
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null
    }
  },

  /**
   * Get frames for a volumetric video
   * @param {number} videoId - Video ID
   * @param {Object} options - Query options
   * @param {number} options.startFrame - Start frame number (optional)
   * @param {number} options.endFrame - End frame number (optional)
   * @param {number} options.limit - Maximum frames to return
   * @returns {Promise<Array>} Array of frames
   */
  async getFrames(videoId, options = {}) {
    const { startFrame, endFrame, limit = 100 } = options
    
    let query = 'SELECT * FROM volumetric_video_frames WHERE volumetric_video_id = $1'
    const params = [videoId]
    
    if (startFrame !== undefined) {
      query += ' AND frame_number >= $' + (params.length + 1)
      params.push(startFrame)
    }
    
    if (endFrame !== undefined) {
      query += ' AND frame_number <= $' + (params.length + 1)
      params.push(endFrame)
    }
    
    query += ' ORDER BY frame_number ASC LIMIT $' + (params.length + 1)
    params.push(limit)
    
    const result = await pool.query(query, params)
    return result.rows
  },

  /**
   * Add frame to volumetric video
   * @param {number} videoId - Video ID
   * @param {Object} frameData - Frame data
   * @returns {Promise<Object>} Created frame
   */
  async addFrame(videoId, frameData) {
    const { frame_number, frame_path, timestamp } = frameData
    
    const result = await pool.query(
      `INSERT INTO volumetric_video_frames 
       (volumetric_video_id, frame_number, frame_path, timestamp)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (volumetric_video_id, frame_number) 
       DO UPDATE SET frame_path = EXCLUDED.frame_path, timestamp = EXCLUDED.timestamp
       RETURNING *`,
      [videoId, frame_number, frame_path, timestamp || null]
    )
    
    return result.rows[0]
  },

  /**
   * Delete volumetric video
   * @param {number} videoId - Video ID
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteVideo(videoId, userId) {
    const result = await pool.query(
      `DELETE FROM volumetric_videos 
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [videoId, userId]
    )
    
    return result.rows.length > 0
  }
}
