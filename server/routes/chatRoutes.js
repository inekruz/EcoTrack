// server/routes/chatRoutes.js
import express from 'express';
import { 
  processChatMessage, 
  getQuickSuggestions, 
  getChatStatus,
  getUserStats
} from '../controllers/chatController.js';

const router = express.Router();

// Маршрут для отправки сообщения
router.post('/message', processChatMessage);

// Маршрут для получения быстрых подсказок
router.get('/suggestions', getQuickSuggestions);

// Маршрут для получения статистики пользователя
router.get('/user/:userId/stats', getUserStats);

// Маршрут для проверки статуса бота
router.get('/status', getChatStatus);

export default router;