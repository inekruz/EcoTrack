import express from 'express';
import {
  analyzeFood,
  getAllFoods,
  getFoodById
} from '../controllers/foodController.js';

const router = express.Router();

// Маршрут для анализа фото
router.post('/analyze', analyzeFood);

// Маршрут для получения всех продуктов
router.get('/foods', getAllFoods);

// Маршрут для получения продукта по ID
router.get('/foods/:id', getFoodById);

export default router;