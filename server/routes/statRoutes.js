import express from 'express'
import {
  getStatistics,
  getComparisonStats,
  getAchievements
} from '../controllers/statController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(authMiddleware)

router.get('/', getStatistics)

router.get('/comparison', getComparisonStats)

router.get('/achievements', getAchievements)

export default router