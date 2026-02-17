import { fileTypeFromFile } from 'file-type'
import { lookup } from 'mime-types'
import path from 'path'
import fs from 'fs/promises'
import { readFile } from 'fs/promises'
import { ALLOWED_EXTENSIONS } from '../constants/fileTypes.js'

/**
 * Map of file extensions to expected MIME types
 */
const EXPECTED_MIME_TYPES = {
  // 3D Model Formats
  '.obj': ['model/obj', 'text/plain', 'application/octet-stream'],
  '.fbx': ['application/octet-stream', 'model/fbx'],
  '.gltf': ['model/gltf+json', 'application/json'],
  '.glb': ['model/gltf-binary', 'application/octet-stream'],
  '.stl': ['model/stl', 'application/octet-stream'],
  '.dae': ['model/vnd.collada+xml', 'application/xml', 'text/xml'],
  '.3ds': ['application/octet-stream', 'image/x-3ds'],
  '.ply': ['application/octet-stream', 'text/plain'],
  // BIM Formats
  '.ifc': ['application/octet-stream', 'application/ifc'],
  '.rvt': ['application/octet-stream'],
  '.nwd': ['application/octet-stream'],
  '.nwc': ['application/octet-stream'],
  '.dwg': ['application/acad', 'application/octet-stream'],
  // Point Cloud Formats
  '.las': ['application/octet-stream'],
  '.laz': ['application/octet-stream'],
  '.xyz': ['text/plain', 'application/octet-stream'],
  '.pts': ['text/plain', 'application/octet-stream'],
  // Image Formats
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.tiff': ['image/tiff'],
  '.tif': ['image/tiff'],
  // Other
  '.csv': ['text/csv', 'text/plain'],
  '.json': ['application/json'],
  '.pdf': ['application/pdf'],
}

/**
 * Validate file content by checking MIME type
 * @param {string} filePath - Path to the uploaded file
 * @param {string} originalName - Original filename
 * @returns {Promise<{valid: boolean, mimeType?: string, error?: string}>}
 */
export const validateFileContent = async (filePath, originalName) => {
  try {
    const fileExt = path.extname(originalName).toLowerCase()
    
    // Check if extension is allowed
    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
      return { valid: false, error: `File extension ${fileExt} is not allowed` }
    }

    // Get expected MIME types for this extension
    const expectedMimeTypes = EXPECTED_MIME_TYPES[fileExt] || []
    
    // Try to detect actual MIME type from file content
    let detectedMime = null
    try {
      // Read first 4100 bytes for file type detection
      const buffer = await readFile(filePath, { start: 0, end: 4100 })
      const fileType = await fileTypeFromFile(buffer)
      detectedMime = fileType?.mime || null
    } catch (error) {
      // file-type might not detect all formats, fall back to lookup
      detectedMime = lookup(fileExt) || null
    }

    // For some formats (like text-based), we can't reliably detect MIME type
    // So we allow if extension is valid and file exists
    if (expectedMimeTypes.length === 0) {
      // Check if file exists and is readable
      try {
        await fs.access(filePath, fs.constants.R_OK)
        return { valid: true, mimeType: detectedMime || lookup(fileExt) }
      } catch {
        return { valid: false, error: 'File is not readable' }
      }
    }

    // If we detected a MIME type, validate it
    if (detectedMime) {
      // Check if detected MIME matches expected types
      const isValidMime = expectedMimeTypes.some(expected => 
        detectedMime.includes(expected.split('/')[0]) || // Match type (e.g., 'image')
        detectedMime === expected ||
        expectedMimeTypes.includes(detectedMime)
      )

      if (!isValidMime) {
        return { 
          valid: false, 
          error: `File content does not match extension. Expected: ${expectedMimeTypes.join(', ')}, Detected: ${detectedMime}` 
        }
      }
    }

    // Additional validation: Check file is not empty
    const stats = await fs.stat(filePath)
    if (stats.size === 0) {
      return { valid: false, error: 'File is empty' }
    }

    return { valid: true, mimeType: detectedMime || lookup(fileExt) }
  } catch (error) {
    return { valid: false, error: `Validation error: ${error.message}` }
  }
}

/**
 * Sanitize filename to prevent directory traversal and special characters
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
export const sanitizeFilename = (filename) => {
  // Remove path separators and dangerous characters
  return filename
    .replace(/[\/\\?%*:|"<>]/g, '_') // Replace dangerous chars with underscore
    .replace(/\.\./g, '_') // Prevent directory traversal
    .trim()
    .substring(0, 255) // Limit length
}
