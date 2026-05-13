import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api'
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  }
)

export const getProfile = async () => {
  const response = await api.get('/auth/profile')
  return response.data
}

export const updateProfile = async (data) => {
  const response = await api.put('/auth/profile', data)
  return response.data
}

export const getFoodEntries = async (startDate, endDate) => {
  const response = await api.get('/foodEntry', {
    params: {
      start_date: startDate,
      end_date: endDate
    }
  })
  return response.data
}

// Получить одну запись по ID
export const getFoodEntryById = async (id) => {
  const response = await api.get(`/foodEntry/${id}`)
  return response.data
}

// Добавить новую запись приёма пищи
export const addFoodEntry = async (entryData) => {
  const response = await api.post('/foodEntry', entryData)
  return response.data
}

// Обновить существующую запись
export const updateFoodEntry = async (id, entryData) => {
  const response = await api.put(`/foodEntry/${id}`, entryData)
  return response.data
}

// Удалить запись
export const deleteFoodEntry = async (id) => {
  const response = await api.delete(`/foodEntry/${id}`)
  return response.data
}

// Получить записи за сегодня
export const getTodayFoodEntries = async () => {
  const today = new Date().toISOString().split('T')[0]
  return getFoodEntries(today, today)
}

// Получить записи за текущую неделю
export const getWeekFoodEntries = async () => {
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay()) // воскресенье
  const endOfWeek = new Date(today)
  endOfWeek.setDate(today.getDate() + (6 - today.getDay())) // суббота

  const startDate = startOfWeek.toISOString().split('T')[0]
  const endDate = endOfWeek.toISOString().split('T')[0]

  return getFoodEntries(startDate, endDate)
}

// Получить записи за текущий месяц
export const getMonthFoodEntries = async () => {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  const startDate = startOfMonth.toISOString().split('T')[0]
  const endDate = endOfMonth.toISOString().split('T')[0]

  return getFoodEntries(startDate, endDate)
}


// Получить статистику за период
export const getStatistics = async (period = 'week', startDate = null, endDate = null) => {
  const params = {}
  if (startDate && endDate) {
    params.start_date = startDate
    params.end_date = endDate
  } else {
    params.period = period
  }
  const response = await api.get('/stat', { params })
  return response.data
}

// Получить сравнительную статистику
export const getComparisonStats = async (week1Start, week1End, week2Start, week2End) => {
  const response = await api.get('/stat/comparison', {
    params: {
      week1_start: week1Start,
      week1_end: week1End,
      week2_start: week2Start,
      week2_end: week2End
    }
  })
  return response.data
}

// Получить достижения
export const getAchievements = async (startDate, endDate) => {
  const response = await api.get('/stat/achievements', {
    params: { start_date: startDate, end_date: endDate }
  })
  return response.data
}
export default api