import pool from '../db.js'

export const addFoodEntry = async (req, res) => {
  try {
    const userId = req.user.id
    const {
      meal_type,
      eaten_at,
      product_name,
      source_type,
      portion_grams,
      calories,
      protein,
      fat,
      carbs,
      barcode_value,
      photo_url,
      manual_notes
    } = req.body

    if (!meal_type || !product_name || !source_type || !portion_grams || typeof calories !== 'number' || calories < 0) {
      return res.status(400).json({
        message: 'Заполните обязательные поля: meal_type, product_name, source_type, portion_grams, calories'
      })
    }

    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack']
    if (!validMealTypes.includes(meal_type)) {
      return res.status(400).json({ message: 'Некорректный тип приёма пищи' })
    }

    const validSourceTypes = ['barcode', 'photo', 'manual']
    if (!validSourceTypes.includes(source_type)) {
      return res.status(400).json({ message: 'Некорректный источник добавления' })
    }

    if (portion_grams <= 0) {
      return res.status(400).json({ message: 'Порция должна быть положительным числом' })
    }

    const newEntry = await pool.query(
      `
      INSERT INTO food_entries (
        user_id, meal_type, eaten_at,
        product_name, source_type, portion_grams,
        calories, protein, fat, carbs,
        barcode_value, photo_url, manual_notes
      )
      VALUES ($1, $2, COALESCE($3, CURRENT_TIMESTAMP), $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
      `,
      [
        userId,
        meal_type,
        eaten_at || null,
        product_name,
        source_type,
        portion_grams,
        calories,
        protein || null,
        fat || null,
        carbs || null,
        barcode_value || null,
        photo_url || null,
        manual_notes || null
      ]
    )

    return res.status(201).json(newEntry.rows[0])
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}

export const getEntriesByPeriod = async (req, res) => {
  try {
    const userId = req.user.id
    const { start_date, end_date } = req.query

    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'Укажите start_date и end_date (YYYY-MM-DD)' })
    }

    const entries = await pool.query(
      `
      SELECT *
      FROM food_entries
      WHERE user_id = $1
        AND eaten_at::date >= $2::date
        AND eaten_at::date <= $3::date
      ORDER BY eaten_at ASC
      `,
      [userId, start_date, end_date]
    )

    return res.json(entries.rows)
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}

export const getEntryById = async (req, res) => {
  try {
    const userId = req.user.id
    const entryId = req.params.id

    const entry = await pool.query(
      `
      SELECT *
      FROM food_entries
      WHERE id = $1 AND user_id = $2
      `,
      [entryId, userId]
    )

    if (entry.rows.length === 0) {
      return res.status(404).json({ message: 'Запись не найдена' })
    }

    return res.json(entry.rows[0])
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}

export const updateFoodEntry = async (req, res) => {
  try {
    const userId = req.user.id
    const entryId = req.params.id

    const {
      meal_type,
      eaten_at,
      product_name,
      source_type,
      portion_grams,
      calories,
      protein,
      fat,
      carbs,
      barcode_value,
      photo_url,
      manual_notes
    } = req.body

    const existing = await pool.query(
      `SELECT id FROM food_entries WHERE id = $1 AND user_id = $2`,
      [entryId, userId]
    )
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Запись не найдена' })
    }

    const updated = await pool.query(
      `
      UPDATE food_entries
      SET
        meal_type = COALESCE($1, meal_type),
        eaten_at = COALESCE($2, eaten_at),
        product_name = COALESCE($3, product_name),
        source_type = COALESCE($4, source_type),
        portion_grams = COALESCE($5, portion_grams),
        calories = COALESCE($6, calories),
        protein = COALESCE($7, protein),
        fat = COALESCE($8, fat),
        carbs = COALESCE($9, carbs),
        barcode_value = COALESCE($10, barcode_value),
        photo_url = COALESCE($11, photo_url),
        manual_notes = COALESCE($12, manual_notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13 AND user_id = $14
      RETURNING *
      `,
      [
        meal_type || null,
        eaten_at || null,
        product_name || null,
        source_type || null,
        portion_grams || null,
        calories || null,
        protein || null,
        fat || null,
        carbs || null,
        barcode_value || null,
        photo_url || null,
        manual_notes || null,
        entryId,
        userId
      ]
    )

    return res.json(updated.rows[0])
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}

export const deleteFoodEntry = async (req, res) => {
  try {
    const userId = req.user.id
    const entryId = req.params.id

    const result = await pool.query(
      `
      DELETE FROM food_entries
      WHERE id = $1 AND user_id = $2
      RETURNING id
      `,
      [entryId, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Запись не найдена' })
    }

    return res.json({ message: 'Запись удалена', id: entryId })
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}