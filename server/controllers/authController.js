import pool from '../db.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d'
    }
  )
}

export const register = async (req, res) => {
  try {
    const {
      username,
      email,
      password,

      gender,
      weight,
      height,
      age,

      activity_level,
      goal,

      water_goal,
      sleep_goal,

      avatar,
      bio,
      location,
      daily_calories
    } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({
        message: 'Заполните все обязательные поля'
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Пароль минимум 6 символов'
      })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Некорректный email'
      })
    }

    const userExists = await pool.query(
      `
      SELECT id FROM users
      WHERE email = $1 OR username = $2
      `,
      [email, username]
    )

    if (userExists.rows.length > 0) {
      return res.status(400).json({
        message: 'Пользователь уже существует'
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await pool.query(
      `
      INSERT INTO users (
        username,
        email,
        password,

        gender,
        weight,
        height,
        age,

        activity_level,
        goal,

        water_goal,
        sleep_goal,

        avatar,
        bio,
        location,
        daily_calories
      )
      VALUES (
        $1,$2,$3,
        $4,$5,$6,$7,
        $8,$9,
        $10,$11,
        $12,$13,$14,$15
      )
      RETURNING *
      `,
      [
        username,
        email,
        hashedPassword,

        gender || null,
        weight || null,
        height || null,
        age || null,

        activity_level || null,
        goal || null,

        water_goal || null,
        sleep_goal || null,

        avatar || null,
        bio || null,
        location || null,
        daily_calories || null
      ]
    )

    const token = generateToken(newUser.rows[0].id)

    return res.json({
      token,
      user: newUser.rows[0]
    })
  } catch (e) {
    return res.status(500).json({
      message: e.message
    })
  }
}

export const login = async (req, res) => {
  try {
    const { login, password } = req.body

    if (!login || !password) {
      return res.status(400).json({
        message: 'Заполните поля'
      })
    }

    const user = await pool.query(
      `
      SELECT * FROM users
      WHERE email = $1
      OR username = $1
      `,
      [login]
    )

    if (!user.rows[0]) {
      return res.status(400).json({
        message:
          'Пользователь не найден'
      })
    }

    const validPassword =
      await bcrypt.compare(
        password,
        user.rows[0].password
      )

    if (!validPassword) {
      return res.status(400).json({
        message: 'Неверный пароль'
      })
    }

    const token = generateToken(
      user.rows[0].id
    )

    res.json({
      token,
      user: user.rows[0]
    })
  } catch (e) {
    res.status(500).json({
      message: e.message
    })
  }
}

export const checkAuth = async (
  req,
  res
) => {
  try {
    const user = await pool.query(
      `
      SELECT id, username, email
      FROM users
      WHERE id = $1
      `,
      [req.user.id]
    )

    res.json(user.rows[0])
  } catch (e) {
    res.status(500).json({
      message: e.message
    })
  }
}

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `
    SELECT
      id,
        username,
        email,
        password,

        gender,
        weight,
        height,
        age,

        activity_level,
        goal,

        water_goal,
        sleep_goal,

        avatar,
        bio,
        location,
        daily_calories,
        created_at,
        phone
    FROM users
    WHERE id = $1
      `,
      [userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Ошибка получения профиля'
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      name,
      email,
      location,
      bio,
      avatar,
      
      gender,
      weight,
      height,
      age,
      
      activity_level,
      goal,
      
      water_goal,
      sleep_goal,
      
      daily_calories,
      phone
    } = req.body;

    const result = await pool.query(
      `
      UPDATE users
      SET
        username=$1,
        email=$2,
        gender=$3,
        weight=$4,
        height=$5,
        age=$6,
        activity_level=$7,
        goal=$8,
        water_goal=$9,
        sleep_goal=$10,
        avatar=$11,
        bio=$12,
        location=$13,
        daily_calories=$14,
        phone=$15
      WHERE id = $16
      RETURNING *
      `,
      [
        name,
        email,
        gender,
        weight,
        height,
        age,
        activity_level,
        goal,
        water_goal,
        sleep_goal,
        avatar,
        bio,
        location,
        daily_calories,
        phone,
        userId
      ]
    );

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Ошибка обновления профиля'
    });
  }
};
