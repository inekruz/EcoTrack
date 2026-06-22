import { useState, useContext } from 'react'
import {
  AuthContext
} from '../context/AuthContext'
import {
  Link,
  useNavigate
} from 'react-router-dom'

import {
  FaHeartbeat
} from 'react-icons/fa'

import api from '../api'

function Login() {

  const navigate = useNavigate()

  const [form, setForm] = useState({
    login: '',
    password: ''
  })
  const { login } = useContext(AuthContext)

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {

      const res = await api.post(
        '/auth/login',
        form
      )

      login(
        res.data.token,
        res.data.user
      )

      navigate('/dashboard')

    } catch (e) {
      alert(
        e.response?.data?.message
      )
    }
  }

  return (
    <div className="auth-page">

      <div className="auth-overlay"></div>

      <div className="auth-container">

        <div className="auth-left">

          <div className="auth-brand">
            <FaHeartbeat />
            <span>EcoTrack</span>
          </div>

          <h1>
            Добро пожаловать
            обратно
          </h1>

          <p>
            Продолжайте контролировать
            питание, калории и свой
            прогресс в здоровом образе
            жизни.
          </p>

        </div>

        <div className="auth-card">

          <h2>
            Вход
          </h2>

          <p className="auth-subtitle">
            Войдите в свой аккаунт
          </p>

          <form onSubmit={handleSubmit}>

            <input
              type="text"
              placeholder="Логин или Email"
              onChange={(e) =>
                setForm({
                  ...form,
                  login: e.target.value
                })
              }
            />

            <input
              type="password"
              placeholder="Пароль"
              onChange={(e) =>
                setForm({
                  ...form,
                  password: e.target.value
                })
              }
            />

            <button className="auth-btn active">
              Войти
            </button>

          </form>

          <div className="auth-footer">

            <span>
              Нет аккаунта?
            </span>

            <Link to="/register">
              Регистрация
            </Link>

          </div>

        </div>

      </div>

    </div>
  )
}

export default Login