import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { userService } from '../services/userService.js'
import { asyncHandler, createError } from '../utils/errorHandler.js'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Get current user profile
router.get('/me', asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user.id)

  if (!user) {
    throw createError('User not found', 404)
  }

  res.json(user)
}))

// Update user profile
router.put('/me', asyncHandler(async (req, res) => {
  const { name, email } = req.body

  const user = await userService.updateProfile(req.user.id, { name, email })

  if (!user) {
    throw createError('User not found', 404)
  }

  res.json(user)
}))

// Get user statistics
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await userService.getStats(req.user.id)
  res.json(stats)
}))

export default router
