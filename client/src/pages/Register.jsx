import { useState, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { FaLeaf } from 'react-icons/fa'
import api from '../api'

function Register() {
  const navigate = useNavigate()
  const { login } = useContext(AuthContext)

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',

    gender: '',
    weight: '',
    height: '',
    age: '',

    activity_level: '',
    goal: '',

    water_goal: '',
    sleep_goal: ''
  })

  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  const handleCheckboxChange = (e) => {
    setAgreedToTerms(e.target.checked)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!agreedToTerms) {
      alert('Пожалуйста, примите условия оферты')
      return
    }

    try {
      const res = await api.post('/auth/register', form)

      login(res.data.token, res.data.user)
      navigate('/dashboard')
    } catch (e) {
      alert(e.response?.data?.message)
    }
  }

  return (
    <div className="auth-page">

      <div className="auth-overlay"></div>

      <div className="auth-container">

        <div className="auth-left">
          <div className="auth-brand">
            <FaLeaf />
            <span>EcoTrack</span>
          </div>

          <h1>Начни менять своё питание</h1>

          <p>
            Создайте аккаунт и получите доступ к анализу питания и статистике.
          </p>
        </div>

        <div className="auth-card">

          <h2>Регистрация</h2>
          <p className="auth-subtitle">Создайте новый аккаунт</p>

          <form onSubmit={handleSubmit}>

            <input
              name="username"
              type="text"
              placeholder="Логин"
              onChange={handleChange}
              required
            />

            <input
              name="email"
              type="email"
              placeholder="Email"
              onChange={handleChange}
              required
            />

            <input
              name="password"
              type="password"
              placeholder="Пароль"
              onChange={handleChange}
              required
            />

            <select
              name="gender"
              onChange={handleChange}
            >
              <option value="">Пол</option>
              <option value="male">Мужской</option>
              <option value="female">Женский</option>
            </select>

            <div className="double-input">
              <input
                name="weight"
                type="number"
                placeholder="Вес"
                onChange={handleChange}
              />

              <input
                name="height"
                type="number"
                placeholder="Рост"
                onChange={handleChange}
              />
            </div>

            <input
              name="age"
              type="number"
              placeholder="Возраст"
              onChange={handleChange}
            />

            <select name="activity_level" onChange={handleChange}>
              <option value="">Активность</option>
              <option value="low">Низкая</option>
              <option value="medium">Средняя</option>
              <option value="high">Высокая</option>
            </select>

            <select name="goal" onChange={handleChange}>
              <option value="">Цель</option>
              <option value="lose">Похудение</option>
              <option value="maintain">Поддержание</option>
              <option value="gain">Набор массы</option>
            </select>

            <input
              name="water_goal"
              type="number"
              placeholder="Вода (мл)"
              onChange={handleChange}
            />

            <input
              name="sleep_goal"
              type="number"
              placeholder="Сон (часы)"
              onChange={handleChange}
            />

            <div className="terms-agreement">
              <label className="custom-checkbox">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={handleCheckboxChange}
                />
                <span className="checkmark"></span>
                <span className="terms-text">
                  Я принимаю условия{' '}
                  <Link to="/oferta" target="_blank">
                    публичной оферты
                  </Link>
                </span>
              </label>
            </div>

            <button 
              className={`auth-btn ${agreedToTerms ? 'active' : 'disabled'}`}
              type="submit"
              disabled={!agreedToTerms}
            >
              {agreedToTerms ? 'Создать аккаунт' : 'Примите условия'}
            </button>

          </form>

          <div className="auth-footer">
            <span>Уже есть аккаунт?</span>
            <Link to="/login">Войти</Link>
          </div>

        </div>

      </div>
    </div>
  )
}

export default Register