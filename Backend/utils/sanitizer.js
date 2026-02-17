/**
 * Input sanitization utilities
 */

/**
 * Sanitize string input to prevent XSS
 * @param {string} input - Input string
 * @returns {string} Sanitized string
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') return input
  
  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .trim()
}

/**
 * Sanitize object recursively
 * @param {any} obj - Object to sanitize
 * @returns {any} Sanitized object
 */
export const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj
  
  if (typeof obj === 'string') {
    return sanitizeString(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item))
  }
  
  if (typeof obj === 'object') {
    const sanitized = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject(obj[key])
      }
    }
    return sanitized
  }
  
  return obj
}

/**
 * Express middleware to sanitize request body
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
export const sanitizeMiddleware = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body)
  }
  if (req.query) {
    req.query = sanitizeObject(req.query)
  }
  if (req.params) {
    req.params = sanitizeObject(req.params)
  }
  next()
}
