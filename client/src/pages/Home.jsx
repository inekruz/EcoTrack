import { Link } from 'react-router-dom'

import {
  FaChartLine,
  FaCamera,
  FaAppleAlt,
  FaHeartbeat,
  FaFire,
  FaRobot
} from 'react-icons/fa'

function Home() {
  return (
    <main className="home-page">

      <section className="hero">

        <div className="container hero-content">

          <div className="hero-text">

            <div className="hero-badge">
              EcoTrack • AI Nutrition
            </div>

            <h1>
              Умный контроль
              питания и калорий
            </h1>

            <p>
              <strong>EcoTrack</strong>
              {' '}
              — современная система анализа
              питания и здорового образа жизни,
              позволяющая отслеживать рацион,
              подсчитывать калории,
              анализировать блюда по фотографии
              и получать персональные рекомендации
              на основе искусственного интеллекта.
            </p>

            <p>
              Ведите дневник питания,
              отслеживайте прогресс,
              контролируйте баланс БЖУ
              и формируйте полезные привычки
              через удобный и современный интерфейс.
            </p>

            <div className="hero-buttons">

              <Link to="/register">
                <button className="primary-btn big-btn">
                  Начать бесплатно
                </button>
              </Link>

              <Link to="/login">
                <button className="secondary-btn big-btn">
                  Войти в аккаунт
                </button>
              </Link>

            </div>

          </div>

          <div className="hero-right">

            <div className="glass-card card-main">
              <FaFire className="card-icon" />

              <h3>
                Подсчёт калорий
              </h3>

              <p>
                Анализируйте дневной рацион
                и следите за балансом питания
              </p>
            </div>

            <div className="mini-grid">

              <div className="glass-card">
                <FaCamera className="card-icon" />

                <h4>
                  Анализ фото
                </h4>

                <p>
                  Определение блюд через ИИ
                </p>
              </div>

              <div className="glass-card">
                <FaChartLine className="card-icon" />

                <h4>
                  Статистика
                </h4>

                <p>
                  Графики и прогресс
                </p>
              </div>

              <div className="glass-card">
                <FaRobot className="card-icon" />

                <h4>
                  AI рекомендации
                </h4>

                <p>
                  Персональные советы
                </p>
              </div>

              <div className="glass-card">
                <FaAppleAlt className="card-icon" />

                <h4>
                  Дневник питания
                </h4>

                <p>
                  Учёт каждого приёма пищи
                </p>
              </div>

            </div>

          </div>

        </div>

      </section>

      <section className="features">

        <div className="container">

          <div className="section-title">
            <h2>
              Возможности системы
            </h2>

            <p>
              Всё необходимое для контроля
              питания и здорового образа жизни
            </p>
          </div>

          <div className="features-grid">

            <div className="feature-card">
              <FaHeartbeat className="feature-icon" />

              <h3>
                Контроль здоровья
              </h3>

              <p>
                Отслеживание веса,
                калорий и пищевого баланса
              </p>
            </div>

            <div className="feature-card">
              <FaCamera className="feature-icon" />

              <h3>
                Анализ блюд
              </h3>

              <p>
                Распознавание продуктов
                и блюд по фотографии
              </p>
            </div>

            <div className="feature-card">
              <FaChartLine className="feature-icon" />

              <h3>
                Визуализация
              </h3>

              <p>
                Графики прогресса
                и аналитика питания
              </p>
            </div>

          </div>

        </div>

      </section>

    </main>
  )
}

export default Home