import pool from '../db.js';

// Функция для получения актуальных моделей с поддержкой зрения
const getAvailableVisionModels = async () => {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
      }
    });
    
    const data = await response.json();
    
    if (!data.data) {
      console.log('⚠️ Не удалось получить список моделей, используем запасной список');
      return getFallbackModels();
    }
    
    // Фильтруем модели с поддержкой зрения и сортируем по популярности
    const visionModels = data.data
      .filter(model => {
        const id = model.id.toLowerCase();
        return id.includes('vision') || 
               id.includes('vl') || 
               id.includes('multimodal') ||
               id.includes('gemini') ||
               id.includes('gpt-4') && id.includes('vision');
      })
      .sort((a, b) => {
        // Сортируем: сначала бесплатные, потом платные
        const aFree = a.id.includes(':free');
        const bFree = b.id.includes(':free');
        if (aFree && !bFree) return -1;
        if (!aFree && bFree) return 1;
        return 0;
      })
      .map(model => model.id);
    
    
    if (visionModels.length === 0) {
      console.log('⚠️ Модели с поддержкой зрения не найдены, используем запасной список');
      return getFallbackModels();
    }
    
    return visionModels;
    
  } catch (error) {
    console.error('❌ Ошибка получения моделей:', error);
    return getFallbackModels();
  }
};

// Запасной список моделей (проверенные рабочие модели)
const getFallbackModels = () => {
  return [
    'google/gemini-2.0-flash-exp:free',
    'google/gemini-2.0-flash-lite-preview-02-05:free',
    'meta-llama/llama-3.2-90b-vision-instruct:free',
    'qwen/qwen-2-vl-72b-instruct:free',
    'microsoft/phi-3.5-vision-instruct:free'
  ];
};

// Функция для анализа изображения с повторными попытками
const analyzeFoodImage = async (base64Image) => {
  // Получаем актуальные модели
  let models = await getAvailableVisionModels();
  
  // Ограничиваем количество попыток до 5
  if (models.length > 5) {
    models = models.slice(0, 5);
  }
  
  let lastError = null;
  
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
          'X-Title': 'Food Analyzer'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Проанализируй изображение еды и верни результат в строгом формате JSON.
                  
                  Если на фото есть еда, верни:
                  {
                    "foodFound": true,
                    "foodData": {
                      "name": "название блюда на русском",
                      "description": "краткое описание блюда",
                      "ingredients": ["ингредиент1", "ингредиент2"],
                      "nutritionalInfo": {
                        "calories": 0,
                        "proteins": 0,
                        "fats": 0,
                        "carbohydrates": 0,
                        "fiber": 0,
                        "sugar": 0,
                        "sodium": 0,
                        "cholesterol": 0
                      },
                      "servingSize": "100г",
                      "category": "тип блюда",
                      "cookingMethod": "способ приготовления",
                      "allergens": ["аллерген1"]
                    }
                  }
                  
                  Если на фото нет еды, верни:
                  {
                    "foodFound": false
                  }
                  
                  ВАЖНО: Ответь ТОЛЬКО JSON, без пояснений и дополнительного текста!`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: base64Image
                  }
                }
              ]
            }
          ],
          temperature: 0.3,
          max_tokens: 800
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        lastError = `${model}: ${response.status} - ${errorText.substring(0, 200)}`;
        
        // Если модель не найдена (404) или невалидна (400) - пробуем следующую
        if (response.status === 404 || response.status === 400) {
          continue;
        }
        // Для других ошибок тоже пробуем следующую модель
        continue;
      }

      const data = await response.json();
      
      const content = data.choices[0].message.content;
      
      // Пытаемся извлечь JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Не удалось извлечь JSON из ответа');
      }
      
      const result = JSON.parse(jsonMatch[0]);
      
      // Проверяем структуру ответа
      if (result.foodFound === undefined) {
        throw new Error('Неверная структура ответа');
      }
      
      return result;
      
    } catch (error) {
      console.log(`❌ Ошибка с моделью ${model}:`, error.message);
      lastError = error.message;
      // Продолжаем со следующей моделью
    }
  }
  
  // Если все модели не сработали
  throw new Error(`Все модели не сработали. Последняя ошибка: ${lastError}`);
};

// Контроллер для обработки фото
export const analyzeFood = async (req, res) => {
  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({
        error: 'Изображение не предоставлено',
        message: 'Пожалуйста, отправьте изображение в формате base64'
      });
    }

    // Проверяем формат base64
    if (!image.startsWith('data:image/')) {
      return res.status(400).json({
        error: 'Неверный формат изображения',
        message: 'Изображение должно быть в формате base64 с префиксом data:image/'
      });
    }

    // Проверяем наличие API ключа
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('❌ OPENROUTER_API_KEY не найден в .env');
      return res.status(500).json({
        error: 'Ошибка конфигурации сервера',
        message: 'API ключ OpenRouter не настроен'
      });
    }

    
    // Анализируем изображение через OpenRouter
    const result = await analyzeFoodImage(image);

    // Проверяем найдена ли еда
    if (!result.foodFound || !result.foodData) {
      return res.status(404).json({
        error: 'Еда не найдена',
        message: 'На изображении не удалось обнаружить блюда или продукты. Попробуйте загрузить другое фото.'
      });
    }

    const foodData = result.foodData;
    
    // Валидация данных
    if (!foodData.name) {
      return res.status(400).json({
        error: 'Неполные данные',
        message: 'Не удалось получить название блюда'
      });
    }
    
    // Сохраняем в базу данных
    const query = `
      INSERT INTO foods (
        name, 
        description, 
        ingredients, 
        calories, 
        proteins, 
        fats, 
        carbohydrates,
        fiber,
        sugar,
        sodium,
        cholesterol,
        serving_size,
        category,
        cooking_method,
        allergens,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
      RETURNING *
    `;

    const values = [
      foodData.name,
      foodData.description || '',
      JSON.stringify(foodData.ingredients || []),
      foodData.nutritionalInfo?.calories || 0,
      foodData.nutritionalInfo?.proteins || 0,
      foodData.nutritionalInfo?.fats || 0,
      foodData.nutritionalInfo?.carbohydrates || 0,
      foodData.nutritionalInfo?.fiber || 0,
      foodData.nutritionalInfo?.sugar || 0,
      foodData.nutritionalInfo?.sodium || 0,
      foodData.nutritionalInfo?.cholesterol || 0,
      foodData.servingSize || '100г',
      foodData.category || '',
      foodData.cookingMethod || '',
      JSON.stringify(foodData.allergens || [])
    ];

    const savedFood = await pool.query(query, values);

    // Формируем ответ
    const response = {
      success: true,
      food: {
        id: savedFood.rows[0].id,
        name: savedFood.rows[0].name,
        description: savedFood.rows[0].description,
        ingredients: savedFood.rows[0].ingredients,
        nutritionalInfo: {
          calories: savedFood.rows[0].calories,
          proteins: savedFood.rows[0].proteins,
          fats: savedFood.rows[0].fats,
          carbohydrates: savedFood.rows[0].carbohydrates,
          fiber: savedFood.rows[0].fiber,
          sugar: savedFood.rows[0].sugar,
          sodium: savedFood.rows[0].sodium,
          cholesterol: savedFood.rows[0].cholesterol
        },
        servingSize: savedFood.rows[0].serving_size,
        category: savedFood.rows[0].category,
        cookingMethod: savedFood.rows[0].cooking_method,
        allergens: savedFood.rows[0].allergens
      },
      message: '✅ Блюдо успешно распознано и добавлено в базу данных'
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Ошибка при обработке фото:', error);
    
    // Возвращаем детальную ошибку
    return res.status(500).json({
      error: 'Внутренняя ошибка сервера',
      message: error.message || 'Произошла ошибка при обработке изображения'
    });
  }
};

// Контроллер для получения списка доступных моделей
export const getAvailableModels = async (req, res) => {
  try {
    const models = await getAvailableVisionModels();
    
    return res.status(200).json({
      success: true,
      models: models,
      count: models.length,
      apiKeyConfigured: !!process.env.OPENROUTER_API_KEY
    });
  } catch (error) {
    console.error('Ошибка получения моделей:', error);
    return res.status(500).json({
      error: 'Не удалось получить список моделей',
      message: error.message
    });
  }
};

// Остальные контроллеры
export const getAllFoods = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM foods ORDER BY created_at DESC'
    );
    
    return res.status(200).json({
      success: true,
      foods: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('❌ Ошибка при получении продуктов:', error);
    return res.status(500).json({
      error: 'Внутренняя ошибка сервера',
      message: error.message
    });
  }
};

export const getFoodById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM foods WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Не найдено',
        message: 'Продукт с указанным ID не найден'
      });
    }
    
    return res.status(200).json({
      success: true,
      food: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Ошибка при получении продукта:', error);
    return res.status(500).json({
      error: 'Внутренняя ошибка сервера',
      message: error.message
    });
  }
};