import express from 'express'
import { authMiddleware } from '../middleware/authMiddleware.js'
import {
  addFoodEntry,
  getEntriesByPeriod,
  getEntryById,
  updateFoodEntry,
  deleteFoodEntry
} from '../controllers/foodEntryController.js'

const router = express.Router()

router.use(authMiddleware)

router.post('/', addFoodEntry)
router.get('/', getEntriesByPeriod)
router.get('/:id', getEntryById)
router.put('/:id', updateFoodEntry)
router.delete('/:id', deleteFoodEntry)

export default router