import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Video Processing Service - Handles volumetric video frame extraction
 * Uses ffmpeg for video processing (if available) or provides fallback
 */
export const videoProcessor = {
  /**
   * Check if ffmpeg is available
   * @returns {Promise<boolean>}
   */
  async checkFFmpegAvailable() {
    try {
      await execAsync('ffmpeg -version')
      return true
    } catch (error) {
      return false
    }
  },

  /**
   * Extract video metadata (fps, resolution, frame count, duration)
   * @param {string} videoPath - Path to video file
   * @returns {Promise<Object>} Video metadata
   */
  async getVideoMetadata(videoPath) {
    const ffmpegAvailable = await this.checkFFmpegAvailable()
    
    if (!ffmpegAvailable) {
      // Return default metadata if ffmpeg not available
      return {
        fps: 30,
        resolution_width: 1920,
        resolution_height: 1080,
        frame_count: null,
        duration: null,
        format: path.extname(videoPath).toLowerCase()
      }
    }

    try {
      // Get video info using ffprobe
      const { stdout } = await execAsync(
        `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,duration -show_entries format=duration -of json "${videoPath}"`
      )
      
      const info = JSON.parse(stdout)
      const stream = info.streams?.[0]
      const format = info.format

      // Parse frame rate
      let fps = 30
      if (stream?.r_frame_rate) {
        const [num, den] = stream.r_frame_rate.split('/').map(Number)
        fps = den ? num / den : num
      }

      // Get duration
      const duration = parseFloat(format?.duration || stream?.duration || 0)
      const frame_count = Math.floor(duration * fps)

      return {
        fps: Math.round(fps * 100) / 100,
        resolution_width: stream?.width || 1920,
        resolution_height: stream?.height || 1080,
        frame_count,
        duration,
        format: path.extname(videoPath).toLowerCase()
      }
    } catch (error) {
      console.error('Error extracting video metadata:', error)
      // Return default metadata on error
      return {
        fps: 30,
        resolution_width: 1920,
        resolution_height: 1080,
        frame_count: null,
        duration: null,
        format: path.extname(videoPath).toLowerCase()
      }
    }
  },

  /**
   * Extract frames from video file
   * @param {string} videoPath - Path to video file
   * @param {string} outputDir - Directory to save extracted frames
   * @param {Object} options - Extraction options
   * @param {number} options.fps - Frames per second to extract (default: video fps)
   * @param {number} options.maxFrames - Maximum frames to extract (optional)
   * @returns {Promise<Array>} Array of frame file paths
   */
  async extractFrames(videoPath, outputDir, options = {}) {
    const ffmpegAvailable = await this.checkFFmpegAvailable()
    
    if (!ffmpegAvailable) {
      throw new Error('FFmpeg is not available. Please install FFmpeg to process volumetric videos.')
    }

    try {
      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true })

      // Get video metadata
      const metadata = await this.getVideoMetadata(videoPath)
      const extractFps = options.fps || metadata.fps
      const maxFrames = options.maxFrames

      // Build ffmpeg command
      let command = `ffmpeg -i "${videoPath}" -vf fps=${extractFps}`
      
      if (maxFrames) {
        // Limit number of frames
        const duration = maxFrames / extractFps
        command += ` -t ${duration}`
      }

      // Output frame pattern
      const framePattern = path.join(outputDir, 'frame_%06d.png')
      command += ` "${framePattern}"`

      // Execute ffmpeg command
      await execAsync(command)

      // Get list of extracted frames
      const files = await fs.readdir(outputDir)
      const frameFiles = files
        .filter(file => file.startsWith('frame_') && file.endsWith('.png'))
        .sort()
        .map(file => path.join(outputDir, file))

      return frameFiles
    } catch (error) {
      console.error('Error extracting frames:', error)
      throw new Error(`Failed to extract frames: ${error.message}`)
    }
  },

  /**
   * Extract frames as PLY sequences (for 3D volumetric video)
   * This is a placeholder - actual implementation would require specialized tools
   * @param {string} videoPath - Path to video file
   * @param {string} outputDir - Directory to save PLY frames
   * @returns {Promise<Array>} Array of PLY frame paths
   */
  async extractPLYFrames(videoPath, outputDir) {
    // This would require specialized volumetric video processing tools
    // For now, return empty array and log a message
    console.warn('PLY frame extraction requires specialized volumetric video processing tools')
    return []
  },

  /**
   * Process volumetric video and create frame sequence
   * @param {string} videoPath - Path to uploaded video file
   * @param {string} modelId - Model ID
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processing result with frame paths and metadata
   */
  async processVolumetricVideo(videoPath, modelId, options = {}) {
    try {
      // Get video metadata
      const metadata = await this.getVideoMetadata(videoPath)

      // Determine output directory for frames
      const uploadsDir = path.join(__dirname, '../uploads')
      const framesDir = path.join(uploadsDir, 'volumetric_frames', `model_${modelId}`)
      
      // Extract frames
      const frameFiles = await this.extractFrames(videoPath, framesDir, {
        fps: options.fps || metadata.fps,
        maxFrames: options.maxFrames
      })

      // Convert frame paths to relative paths for storage
      const framePaths = frameFiles.map(file => {
        return path.relative(uploadsDir, file).replace(/\\/g, '/')
      })

      return {
        metadata,
        framePaths,
        frameCount: framePaths.length
      }
    } catch (error) {
      console.error('Error processing volumetric video:', error)
      throw error
    }
  }
}
