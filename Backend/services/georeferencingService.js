import pool from '../config/database.js'
import { getCache, setCache, clearCache } from '../utils/queryCache.js'

/**
 * Georeferencing Service - Handles coordinate transformations and georeferencing
 * Separates business logic from route handlers
 */
export const georeferencingService = {
  /**
   * Get model georeferencing data
   * @param {number} modelId - Model ID
   * @returns {Promise<Object|null>} Georeferencing data or null
   */
  async getModelGeoreferencing(modelId) {
    const result = await pool.query(
      `SELECT crs, origin_lat, origin_lon, origin_altitude, transform_matrix 
       FROM models 
       WHERE id = $1`,
      [modelId]
    )
    
    if (result.rows.length === 0) {
      return null
    }
    
    const row = result.rows[0]
    return {
      crs: row.crs,
      origin_lat: row.origin_lat ? parseFloat(row.origin_lat) : null,
      origin_lon: row.origin_lon ? parseFloat(row.origin_lon) : null,
      origin_altitude: row.origin_altitude ? parseFloat(row.origin_altitude) : null,
      transform_matrix: row.transform_matrix || null
    }
  },

  /**
   * Update model georeferencing
   * @param {number} modelId - Model ID
   * @param {number} userId - User ID (for authorization)
   * @param {Object} georefData - Georeferencing data
   * @returns {Promise<Object|null>} Updated georeferencing or null
   */
  async updateGeoreferencing(modelId, userId, georefData) {
    const { crs, origin_lat, origin_lon, origin_altitude, transform_matrix } = georefData
    
    // Verify model ownership
    const ownershipCheck = await pool.query(
      'SELECT id FROM models WHERE id = $1 AND user_id = $2',
      [modelId, userId]
    )
    
    if (ownershipCheck.rows.length === 0) {
      return null
    }
    
    const result = await pool.query(
      `UPDATE models 
       SET crs = $1, origin_lat = $2, origin_lon = $3, origin_altitude = $4, 
           transform_matrix = $5, updated_at = NOW()
       WHERE id = $6 AND user_id = $7
       RETURNING crs, origin_lat, origin_lon, origin_altitude, transform_matrix`,
      [crs || null, origin_lat || null, origin_lon || null, origin_altitude || null,
       transform_matrix ? JSON.stringify(transform_matrix) : null, modelId, userId]
    )
    
    // Clear cache
    clearCache(`models:*`)
    
    return result.rows[0] || null
  },

  /**
   * Convert 3D local coordinates to geographic coordinates (lat/lon/alt)
   * @param {number} modelId - Model ID
   * @param {number} x - Local X coordinate
   * @param {number} y - Local Y coordinate
   * @param {number} z - Local Z coordinate
   * @returns {Promise<Object|null>} Geographic coordinates or null
   */
  async convertToGeographic(modelId, x, y, z) {
    const georef = await this.getModelGeoreferencing(modelId)
    
    if (!georef || !georef.origin_lat || !georef.origin_lon) {
      return null // Model not georeferenced
    }
    
    // Simple offset conversion (can be enhanced with proper CRS transformation)
    // For now, assuming local coordinates are in meters relative to origin
    const EARTH_RADIUS = 6378137 // meters
    
    // Convert local offset to lat/lon (simplified - assumes small distances)
    const latOffset = y / EARTH_RADIUS * (180 / Math.PI)
    const lonOffset = x / (EARTH_RADIUS * Math.cos(georef.origin_lat * Math.PI / 180)) * (180 / Math.PI)
    
    return {
      latitude: georef.origin_lat + latOffset,
      longitude: georef.origin_lon + lonOffset,
      altitude: georef.origin_altitude ? georef.origin_altitude + z : z
    }
  },

  /**
   * Convert geographic coordinates (lat/lon/alt) to 3D local coordinates
   * @param {number} modelId - Model ID
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {number} altitude - Altitude
   * @returns {Promise<Object|null>} Local 3D coordinates or null
   */
  async convertToLocal(modelId, lat, lon, altitude) {
    const georef = await this.getModelGeoreferencing(modelId)
    
    if (!georef || !georef.origin_lat || !georef.origin_lon) {
      return null // Model not georeferenced
    }
    
    // Simple offset conversion (can be enhanced with proper CRS transformation)
    const EARTH_RADIUS = 6378137 // meters
    
    // Convert lat/lon difference to local coordinates (simplified)
    const latDiff = lat - georef.origin_lat
    const lonDiff = lon - georef.origin_lon
    
    const y = latDiff * (Math.PI / 180) * EARTH_RADIUS
    const x = lonDiff * (Math.PI / 180) * EARTH_RADIUS * Math.cos(georef.origin_lat * Math.PI / 180)
    const z = georef.origin_altitude ? altitude - georef.origin_altitude : altitude
    
    return { x, y, z }
  },

  /**
   * Auto-convert annotation coordinates if model is georeferenced
   * @param {number} modelId - Model ID
   * @param {number} x - Local X coordinate
   * @param {number} y - Local Y coordinate
   * @param {number} z - Local Z coordinate
   * @returns {Promise<Object>} Object with both local and geographic coordinates
   */
  async convertAnnotationCoordinates(modelId, x, y, z) {
    const geographic = await this.convertToGeographic(modelId, x, y, z)
    
    return {
      position_x: x,
      position_y: y,
      position_z: z,
      latitude: geographic?.latitude || null,
      longitude: geographic?.longitude || null,
      altitude: geographic?.altitude || null,
      georeferenced: !!geographic
    }
  }
}
