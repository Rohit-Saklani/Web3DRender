/**
 * Simple in-memory query cache for frequently accessed data
 * For production, consider using Redis
 */

const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get cached value
 * @param {string} key - Cache key
 * @returns {any|null} Cached value or null
 */
export const getCache = (key) => {
  const item = cache.get(key)
  if (!item) return null
  
  // Check if expired
  if (Date.now() > item.expiresAt) {
    cache.delete(key)
    return null
  }
  
  return item.value
}

/**
 * Set cache value
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
 */
export const setCache = (key, value, ttl = CACHE_TTL) => {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttl
  })
}

/**
 * Clear cache by key or pattern
 * @param {string} keyOrPattern - Cache key or pattern (e.g., 'user:*')
 */
export const clearCache = (keyOrPattern) => {
  if (keyOrPattern.includes('*')) {
    // Pattern matching
    const pattern = keyOrPattern.replace('*', '')
    for (const key of cache.keys()) {
      if (key.startsWith(pattern)) {
        cache.delete(key)
      }
    }
  } else {
    // Exact match
    cache.delete(keyOrPattern)
  }
}

/**
 * Clear all cache
 */
export const clearAllCache = () => {
  cache.clear()
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
export const getCacheStats = () => {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  }
}
