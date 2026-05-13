import pool from '../db.js'

export const getStatistics = async (req, res) => {
  try {
    const userId = req.user.id
    const { period = 'week', start_date, end_date } = req.query

    let dateFilter = ''
    let params = [userId]

    if (start_date && end_date) {
      dateFilter = `AND eaten_at::date BETWEEN $2::date AND $3::date`
      params.push(start_date, end_date)
    } else {
      // Автоматические периоды
      const today = new Date()
      let startDate = new Date()
      
      switch(period) {
        case 'week':
          startDate.setDate(today.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(today.getMonth() - 1)
          break
        case 'year':
          startDate.setFullYear(today.getFullYear() - 1)
          break
        default:
          startDate.setDate(today.getDate() - 7)
      }
      
      dateFilter = `AND eaten_at::date >= $2::date AND eaten_at::date <= $3::date`
      params.push(startDate.toISOString().split('T')[0], today.toISOString().split('T')[0])
    }

    // Основные данные статистики
    const statsQuery = `
      SELECT 
        DATE(eaten_at) as date,
        SUM(calories) as total_calories,
        SUM(protein) as total_protein,
        SUM(fat) as total_fat,
        SUM(carbs) as total_carbs,
        COUNT(*) as meals_count,
        AVG(calories) as avg_calories
      FROM food_entries
      WHERE user_id = $1 ${dateFilter}
      GROUP BY DATE(eaten_at)
      ORDER BY date ASC
    `

    const statsResult = await pool.query(statsQuery, params)

    // Распределение по типам приёмов пищи
    const mealsDistributionQuery = `
      SELECT 
        meal_type,
        COUNT(*) as count,
        SUM(calories) as total_calories,
        AVG(calories) as avg_calories
      FROM food_entries
      WHERE user_id = $1 ${dateFilter}
      GROUP BY meal_type
    `
    const mealsDistribution = await pool.query(mealsDistributionQuery, params)

    // Распределение по источникам добавления
    const sourceDistributionQuery = `
      SELECT 
        source_type,
        COUNT(*) as count,
        SUM(calories) as total_calories
      FROM food_entries
      WHERE user_id = $1 ${dateFilter}
      GROUP BY source_type
    `
    const sourceDistribution = await pool.query(sourceDistributionQuery, params)

    // Топ продуктов по частоте употребления
    const topProductsQuery = `
      SELECT 
        product_name,
        COUNT(*) as frequency,
        SUM(calories) as total_calories,
        AVG(calories) as avg_calories
      FROM food_entries
      WHERE user_id = $1 ${dateFilter}
      GROUP BY product_name
      ORDER BY frequency DESC
      LIMIT 10
    `
    const topProducts = await pool.query(topProductsQuery, params)

    // Дни с наибольшей калорийностью
    const topDaysQuery = `
      SELECT 
        DATE(eaten_at) as date,
        SUM(calories) as total_calories,
        COUNT(*) as meals_count
      FROM food_entries
      WHERE user_id = $1 ${dateFilter}
      GROUP BY DATE(eaten_at)
      ORDER BY total_calories DESC
      LIMIT 5
    `
    const topDays = await pool.query(topDaysQuery, params)

    // Общая статистика за период
    const totalStatsQuery = `
      SELECT 
        COALESCE(SUM(calories), 0) as total_calories,
        COALESCE(SUM(protein), 0) as total_protein,
        COALESCE(SUM(fat), 0) as total_fat,
        COALESCE(SUM(carbs), 0) as total_carbs,
        COUNT(DISTINCT DATE(eaten_at)) as days_count,
        COUNT(*) as total_meals,
        COALESCE(AVG(calories), 0) as avg_daily_calories
      FROM food_entries
      WHERE user_id = $1 ${dateFilter}
    `
    const totalStats = await pool.query(totalStatsQuery, params)

    // Макронутриентный профиль (средние значения на приём пищи)
    const macroProfileQuery = `
      SELECT 
        AVG(protein) as avg_protein,
        AVG(fat) as avg_fat,
        AVG(carbs) as avg_carbs,
        AVG(calories) as avg_calories,
        AVG(protein * 4 / NULLIF(calories, 0) * 100) as protein_percentage,
        AVG(fat * 9 / NULLIF(calories, 0) * 100) as fat_percentage,
        AVG(carbs * 4 / NULLIF(calories, 0) * 100) as carbs_percentage
      FROM food_entries
      WHERE user_id = $1 ${dateFilter} AND calories > 0
    `
    const macroProfile = await pool.query(macroProfileQuery, params)

    return res.json({
      daily_stats: statsResult.rows,
      meals_distribution: mealsDistribution.rows,
      source_distribution: sourceDistribution.rows,
      top_products: topProducts.rows,
      top_days: topDays.rows,
      total_stats: totalStats.rows[0],
      macro_profile: macroProfile.rows[0],
      period: {
        start_date: params[1],
        end_date: params[2]
      }
    })
  } catch (e) {
    console.error('Statistics error:', e)
    return res.status(500).json({ message: e.message })
  }
}

export const getComparisonStats = async (req, res) => {
  try {
    const userId = req.user.id
    const { week1_start, week1_end, week2_start, week2_end } = req.query

    const getWeekStats = async (start, end) => {
      const query = `
        SELECT 
          COALESCE(SUM(calories), 0) as total_calories,
          COALESCE(SUM(protein), 0) as total_protein,
          COALESCE(SUM(fat), 0) as total_fat,
          COALESCE(SUM(carbs), 0) as total_carbs,
          COUNT(*) as total_meals,
          COUNT(DISTINCT DATE(eaten_at)) as days_count
        FROM food_entries
        WHERE user_id = $1 
          AND eaten_at::date >= $2::date 
          AND eaten_at::date <= $3::date
      `
      const result = await pool.query(query, [userId, start, end])
      return result.rows[0]
    }

    const week1 = await getWeekStats(week1_start, week1_end)
    const week2 = await getWeekStats(week2_start, week2_end)

    return res.json({
      week1: { ...week1, start_date: week1_start, end_date: week1_end },
      week2: { ...week2, start_date: week2_start, end_date: week2_end },
      differences: {
        calories: week2.total_calories - week1.total_calories,
        calories_percent: week1.total_calories ? ((week2.total_calories - week1.total_calories) / week1.total_calories * 100) : 0,
        meals: week2.total_meals - week1.total_meals,
        protein: week2.total_protein - week1.total_protein,
        fat: week2.total_fat - week1.total_fat,
        carbs: week2.total_carbs - week1.total_carbs
      }
    })
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}

export const getAchievements = async (req, res) => {
  try {
    const userId = req.user.id
    const { start_date, end_date } = req.query

    const query = `
      WITH daily_stats AS (
        SELECT 
          DATE(eaten_at) as date,
          SUM(calories) as daily_calories,
          COUNT(*) as daily_meals
        FROM food_entries
        WHERE user_id = $1 
          AND eaten_at::date >= $2::date 
          AND eaten_at::date <= $3::date
        GROUP BY DATE(eaten_at)
      )
      SELECT 
        COUNT(DISTINCT date) as active_days,
        MAX(daily_calories) as max_calories_day,
        MIN(daily_calories) as min_calories_day,
        AVG(daily_calories) as avg_daily_calories,
        MAX(daily_meals) as max_meals_day,
        AVG(daily_meals) as avg_daily_meals
      FROM daily_stats
    `
    const result = await pool.query(query, [userId, start_date, end_date])

    return res.json(result.rows[0])
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}