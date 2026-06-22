// server/controllers/chatController.js
import axios from 'axios';
import dotenv from 'dotenv';
import pool from '../db.js';

dotenv.config();

// Список ключевых слов для фильтрации ЗОЖ-тематики
const HEALTH_KEYWORDS = [
  // Питание
  'калорий', 'калория', 'калории', 'ккал',
  'бжу', 'белки', 'жиры', 'углеводы',
  'диета', 'диет', 'питание', 'рацион',
  'продукт', 'еда', 'блюдо', 'рецепт',
  'завтрак', 'обед', 'ужин', 'перекус',
  'вес', 'похудение', 'набор массы',
  'витамин', 'минерал', 'макроэлемент', 'микроэлемент',
  
  // Тренировки
  'тренировк', 'спорт', 'фитнес', 'упражнение',
  'кардио', 'силовой', 'йога', 'пилатес',
  'мышц', 'выносливость', 'сила',
  
  // Здоровье
  'здоров', 'сон', 'режим', 'вода', 'пить',
  'иммунитет', 'энергия', 'самочувствие',
  'детокс', 'очищение', 'метаболизм',
  
  // Конкретные продукты
  'овощ', 'фрукт', 'мясо', 'рыба', 'крупа',
  'молочн', 'яйцо', 'орех', 'масло',
  'сахар', 'соль', 'белок', 'клетчатк',
  
  // Запросы о себе
  'мой вес', 'мой рост', 'мой возраст', 'моя цель',
  'сколько мне', 'как мне', 'что мне',
];

const HEALTH_PHRASES = [
  'здоровый образ жизни', 'правильное питание',
  'контроль веса', 'здоровая еда',
  'физическая активность', 'режим дня',
  'полезные привычки', 'здоровое тело',
];

// Проверка на ЗОЖ-тематику
const isHealthRelated = (text) => {
  const lowerText = text.toLowerCase();
  
  const hasKeyword = HEALTH_KEYWORDS.some(keyword => 
    lowerText.includes(keyword.toLowerCase())
  );
  
  if (hasKeyword) return true;
  
  const hasPhrase = HEALTH_PHRASES.some(phrase => 
    lowerText.includes(phrase.toLowerCase())
  );
  
  return hasPhrase;
};

// Получение данных пользователя из БД
const getUserData = async (userId) => {
  try {
    const query = `
      SELECT 
        id, username, email,
        gender, weight, height, age,
        activity_level, goal,
        water_goal, sleep_goal,
        daily_calories,
        created_at
      FROM users 
      WHERE id = $1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Ошибка при получении данных пользователя:', error);
    return null;
  }
};

// Получение последних записей питания пользователя
const getUserRecentFoodEntries = async (userId, limit = 5) => {
  try {
    const query = `
      SELECT 
        product_name,
        meal_type,
        eaten_at,
        calories,
        protein,
        fat,
        carbs,
        portion_grams
      FROM food_entries 
      WHERE user_id = $1 
      ORDER BY eaten_at DESC 
      LIMIT $2
    `;
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  } catch (error) {
    console.error('Ошибка при получении записей питания:', error);
    return [];
  }
};

// Получение статистики питания за сегодня
const getTodayStats = async (userId) => {
  try {
    const query = `
      SELECT 
        COALESCE(SUM(calories), 0) as total_calories,
        COALESCE(SUM(protein), 0) as total_protein,
        COALESCE(SUM(fat), 0) as total_fat,
        COALESCE(SUM(carbs), 0) as total_carbs,
        COUNT(*) as meals_count
      FROM food_entries 
      WHERE user_id = $1 
      AND DATE(eaten_at) = CURRENT_DATE
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0] || {
      total_calories: 0,
      total_protein: 0,
      total_fat: 0,
      total_carbs: 0,
      meals_count: 0
    };
  } catch (error) {
    console.error('Ошибка при получении статистики за сегодня:', error);
    return null;
  }
};

// Получение статистики за последние 7 дней
const getWeekStats = async (userId) => {
  try {
    const query = `
      SELECT 
        DATE(eaten_at) as date,
        COALESCE(SUM(calories), 0) as total_calories,
        COALESCE(SUM(protein), 0) as total_protein,
        COALESCE(SUM(fat), 0) as total_fat,
        COALESCE(SUM(carbs), 0) as total_carbs,
        COUNT(*) as meals_count
      FROM food_entries 
      WHERE user_id = $1 
      AND eaten_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(eaten_at)
      ORDER BY DATE(eaten_at) DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Ошибка при получении статистики за неделю:', error);
    return [];
  }
};

// Расчет BMR (базовый метаболизм) по формуле Миффлина-Сан Жеора
const calculateBMR = (user) => {
  if (!user || !user.weight || !user.height || !user.age) return null;
  
  let bmr;
  if (user.gender === 'male') {
    bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age + 5;
  } else if (user.gender === 'female') {
    bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age - 161;
  } else {
    // Для неопределенного пола используем среднее значение
    bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age;
  }
  return Math.round(bmr);
};

// Расчет дневной нормы калорий с учетом активности
const calculateDailyCalories = (user) => {
  const bmr = calculateBMR(user);
  if (!bmr) return null;
  
  const activityMultipliers = {
    'sedentary': 1.2,      // Малоподвижный
    'light': 1.375,        // Легкая активность
    'moderate': 1.55,      // Умеренная активность
    'active': 1.725,       // Высокая активность
    'very_active': 1.9     // Очень высокая активность
  };
  
  const multiplier = activityMultipliers[user.activity_level] || 1.2;
  let dailyCalories = Math.round(bmr * multiplier);
  
  // Корректировка в зависимости от цели
  if (user.goal === 'lose_weight') {
    dailyCalories = Math.round(dailyCalories * 0.85); // Дефицит 15%
  } else if (user.goal === 'gain_weight') {
    dailyCalories = Math.round(dailyCalories * 1.15); // Профицит 15%
  }
  
  return dailyCalories;
};

// Формирование персонализированного системного промпта
const getPersonalizedSystemPrompt = (user, todayStats, weekStats) => {
  let prompt = `Ты - профессиональный консультант по здоровому образу жизни, питанию и фитнесу. 
  Отвечай только на вопросы, связанные с:
  - Питанием и диетологией (калории, БЖУ, продукты, рецепты)
  - Физической активностью (тренировки, упражнения, спорт)
  - Общим здоровьем (сон, вода, режим, самочувствие)
  - Похудением и набором массы
  - Витаминами и микроэлементами
  
  Если вопрос не относится к этим темам, вежливо откажись отвечать и предложи задать вопрос по ЗОЖ-тематике.
  
  Ответы должны быть:
  1. Научно обоснованными
  2. Практичными и полезными
  3. Дружелюбными и мотивирующими
  4. Адаптированными под уровень пользователя
  
  Используй русский язык. Отвечай структурированно, по делу, без воды.`;

  // Добавляем персональные данные пользователя
  if (user) {
    prompt += `\n\nИнформация о пользователе:`;
    
    if (user.gender) {
      const genderMap = { 'male': 'Мужчина', 'female': 'Женщина' };
      prompt += `\n- Пол: ${genderMap[user.gender] || user.gender}`;
    }
    
    if (user.age) {
      prompt += `\n- Возраст: ${user.age} лет`;
    }
    
    if (user.weight) {
      prompt += `\n- Вес: ${user.weight} кг`;
    }
    
    if (user.height) {
      prompt += `\n- Рост: ${user.height} см`;
    }
    
    if (user.activity_level) {
      const activityMap = {
        'sedentary': 'Малоподвижный',
        'light': 'Легкая активность',
        'moderate': 'Умеренная активность',
        'active': 'Высокая активность',
        'very_active': 'Очень высокая активность'
      };
      prompt += `\n- Уровень активности: ${activityMap[user.activity_level] || user.activity_level}`;
    }
    
    if (user.goal) {
      const goalMap = {
        'lose_weight': 'Похудение',
        'gain_weight': 'Набор массы',
        'maintain': 'Поддержание веса'
      };
      prompt += `\n- Цель: ${goalMap[user.goal] || user.goal}`;
    }
    
    // Добавляем рассчитанные показатели
    const bmr = calculateBMR(user);
    if (bmr) {
      prompt += `\n- Базовый метаболизм (BMR): ${bmr} ккал/день`;
    }
    
    const dailyCalories = calculateDailyCalories(user);
    if (dailyCalories) {
      prompt += `\n- Рекомендуемая норма калорий: ${dailyCalories} ккал/день`;
    }
    
    if (user.water_goal) {
      prompt += `\n- Цель по воде: ${user.water_goal} мл/день`;
    }
    
    if (user.sleep_goal) {
      prompt += `\n- Цель по сну: ${user.sleep_goal} часов/день`;
    }
  }

  // Добавляем статистику за сегодня
  if (todayStats) {
    prompt += `\n\nСтатистика питания за сегодня:`;
    prompt += `\n- Потреблено калорий: ${todayStats.total_calories} ккал`;
    prompt += `\n- Белки: ${todayStats.total_protein} г`;
    prompt += `\n- Жиры: ${todayStats.total_fat} г`;
    prompt += `\n- Углеводы: ${todayStats.total_carbs} г`;
    prompt += `\n- Количество приемов пищи: ${todayStats.meals_count}`;
    
    if (user && user.daily_calories) {
      const remaining = user.daily_calories - todayStats.total_calories;
      prompt += `\n- Осталось калорий: ${Math.round(remaining)} ккал`;
    }
  }

  // Добавляем статистику за неделю
  if (weekStats && weekStats.length > 0) {
    const avgCalories = Math.round(weekStats.reduce((sum, day) => sum + day.total_calories, 0) / weekStats.length);
    prompt += `\n\nСтатистика за последние 7 дней:`;
    prompt += `\n- Среднее потребление калорий: ${avgCalories} ккал/день`;
    prompt += `\n- Количество дней с записями: ${weekStats.length}`;
  }

  return prompt;
};

// Определение типа вопроса для более точного ответа
const detectQuestionType = (message) => {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes('калорий') || lowerMsg.includes('калория') || lowerMsg.includes('ккал')) {
    return 'calories';
  }
  
  if (lowerMsg.includes('бжу') || lowerMsg.includes('белки') || lowerMsg.includes('жиры') || lowerMsg.includes('углеводы')) {
    return 'macros';
  }
  
  if (lowerMsg.includes('вес') || lowerMsg.includes('похудеть') || lowerMsg.includes('набрать')) {
    return 'weight';
  }
  
  if (lowerMsg.includes('вод') || lowerMsg.includes('пить')) {
    return 'water';
  }
  
  if (lowerMsg.includes('сон') || lowerMsg.includes('спать')) {
    return 'sleep';
  }
  
  if (lowerMsg.includes('трениров') || lowerMsg.includes('упражн') || lowerMsg.includes('спорт')) {
    return 'fitness';
  }
  
  if (lowerMsg.includes('рецепт') || lowerMsg.includes('блюдо') || lowerMsg.includes('приготов')) {
    return 'recipe';
  }
  
  return 'general';
};

// Основная функция обработки сообщения
export const processChatMessage = async (req, res) => {
  try {
    const { message, userId, history = [] } = req.body;
    
    // Валидация входящих данных
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Сообщение не может быть пустым'
      });
    }
    
    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Сообщение слишком длинное (максимум 2000 символов)'
      });
    }
    
    // Проверка на спам/бессмысленные запросы
    const isSpam = /(\d+\s*ра{1,2}\s*[сc]лов)|(привет\s*как\s*дела)|(расскажи\s*шутку)/gi.test(message);
    if (isSpam && !isHealthRelated(message)) {
      return res.status(400).json({
        success: false,
        message: 'Пожалуйста, задавайте вопросы по теме здорового образа жизни',
        isRejected: true
      });
    }
    
    // Проверка на ЗОЖ-тематику
    if (!isHealthRelated(message)) {
      return res.status(400).json({
        success: false,
        message: 'Извините, я могу отвечать только на вопросы о здоровом образе жизни, питании и фитнесе. Задайте вопрос по этим темам!',
        isRejected: true
      });
    }
    
    // Получение данных пользователя из БД
    let userData = null;
    let todayStats = null;
    let weekStats = [];
    let recentEntries = [];
    
    if (userId) {
      userData = await getUserData(userId);
      if (userData) {
        todayStats = await getTodayStats(userId);
        weekStats = await getWeekStats(userId);
        recentEntries = await getUserRecentFoodEntries(userId, 3);
      }
    }
    
    // Определение типа вопроса
    const questionType = detectQuestionType(message);
    
    // Формирование системного промпта с персональными данными
    const systemPrompt = getPersonalizedSystemPrompt(userData, todayStats, weekStats);
    
    // Формирование сообщений для OpenRouter
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-5),
      { role: 'user', content: message }
    ];
    
    // Проверка наличия API ключа
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY не установлен в .env');
      return res.status(500).json({
        success: false,
        message: 'Ошибка конфигурации сервера. Попробуйте позже.',
        isRejected: true
      });
    }
    
    // Запрос к OpenRouter API
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: 800,
        top_p: 0.9,
        frequency_penalty: 0.5,
        presence_penalty: 0.5,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
          'X-Title': 'EcoTrack ChatBot'
        },
        timeout: 30000
      }
    );
    
    const botMessage = response.data.choices[0].message.content;
    
    // Дополнительная информация для ответа
    const responseData = {
      success: true,
      message: botMessage,
      isRejected: false,
      metadata: {
        questionType,
        hasUserData: !!userData,
        userId: userId || null
      }
    };
    
    // Если есть данные пользователя, добавляем персонализированную информацию
    if (userData) {
      responseData.userInfo = {
        name: userData.username,
        calories: userData.daily_calories || calculateDailyCalories(userData),
        weight: userData.weight,
        height: userData.height,
        age: userData.age,
        goal: userData.goal,
        water_goal: userData.water_goal,
        sleep_goal: userData.sleep_goal
      };
      
      // Добавляем статистику за сегодня
      if (todayStats) {
        responseData.todayStats = {
          calories: todayStats.total_calories,
          protein: todayStats.total_protein,
          fat: todayStats.total_fat,
          carbs: todayStats.total_carbs,
          meals: todayStats.meals_count,
          remaining: userData.daily_calories ? Math.round(userData.daily_calories - todayStats.total_calories) : null
        };
      }
    }
    
    return res.status(200).json(responseData);
    
  } catch (error) {
    console.error('Ошибка в chatController:', error);
    
    if (error.response) {
      console.error('OpenRouter Error:', error.response.data);
      return res.status(error.response.status || 500).json({
        success: false,
        message: 'Ошибка при обращении к ИИ. Попробуйте позже.',
        isRejected: true
      });
    }
    
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        message: 'Превышено время ожидания ответа. Попробуйте еще раз.',
        isRejected: true
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера. Попробуйте позже.',
      isRejected: true
    });
  }
};

// Получение персонализированной статистики пользователя
export const getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Не указан ID пользователя'
      });
    }
    
    const userData = await getUserData(userId);
    if (!userData) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }
    
    const todayStats = await getTodayStats(userId);
    const weekStats = await getWeekStats(userId);
    const bmr = calculateBMR(userData);
    const dailyCalories = calculateDailyCalories(userData);
    const recentEntries = await getUserRecentFoodEntries(userId, 5);
    
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: userData.id,
          username: userData.username,
          weight: userData.weight,
          height: userData.height,
          age: userData.age,
          gender: userData.gender,
          goal: userData.goal,
          activity_level: userData.activity_level,
          water_goal: userData.water_goal,
          sleep_goal: userData.sleep_goal
        },
        metrics: {
          bmr: bmr,
          daily_calories: dailyCalories || userData.daily_calories,
          current_weight: userData.weight,
          goal_weight: null // можно добавить отдельное поле в таблицу
        },
        today: todayStats,
        week: weekStats,
        recent_entries: recentEntries
      }
    });
    
  } catch (error) {
    console.error('Ошибка при получении статистики пользователя:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка при получении статистики'
    });
  }
};

// Получение подсказок для быстрых ответов (персонализированные)
export const getQuickSuggestions = async (req, res) => {
  try {
    const { userId } = req.query;
    let suggestions = [];
    
    if (userId) {
      const userData = await getUserData(userId);
      if (userData) {
        // Персонализированные подсказки на основе данных пользователя
        if (userData.weight && userData.goal) {
          const goalMap = {
            'lose_weight': 'похудеть',
            'gain_weight': 'набрать массу',
            'maintain': 'поддерживать вес'
          };
          suggestions.push(`Как ${goalMap[userData.goal] || 'достичь цели'} при весе ${userData.weight} кг?`);
        }
        
        const dailyCalories = calculateDailyCalories(userData) || userData.daily_calories;
        if (dailyCalories) {
          suggestions.push(`Как распределить ${dailyCalories} калорий на день?`);
        }
        
        if (userData.water_goal) {
          suggestions.push(`Как выпить ${userData.water_goal} мл воды в день?`);
        }
        
        if (userData.weight && userData.height) {
          const bmi = (userData.weight / ((userData.height / 100) ** 2)).toFixed(1);
          suggestions.push(`Мой ИМТ - ${bmi}, что это значит?`);
        }
      }
    }
    
    // Общие подсказки
    const generalSuggestions = [
      'Сколько калорий мне нужно в день?',
      'Как рассчитать БЖУ?',
      'Полезные продукты для похудения',
      'Сколько воды пить в день?',
      'Эффективные упражнения для пресса',
      'Как ускорить метаболизм?',
      'Правильный завтрак для энергии',
      'Витамины для иммунитета',
      'Как улучшить качество сна?',
      'Что есть после тренировки?'
    ];
    
    // Смешиваем персонализированные и общие подсказки
    suggestions = [...suggestions, ...generalSuggestions];
    
    // Уникальные и не более 8
    suggestions = [...new Set(suggestions)].slice(0, 8);
    
    return res.status(200).json({
      success: true,
      suggestions
    });
    
  } catch (error) {
    console.error('Ошибка при получении подсказок:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка при получении подсказок'
    });
  }
};

// Получение статуса бота
export const getChatStatus = async (req, res) => {
  try {
    // Проверка подключения к БД
    await pool.query('SELECT 1');
    
    return res.status(200).json({
      status: 'online',
      version: '2.0.0',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      version: '2.0.0',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};