import {
  Link
} from 'react-router-dom'

function NotFound() {
  return (
    <div className="container">
      <h1>404</h1>

      <p>
        Страница не найдена
      </p>

      <Link to="/">
        На главную
      </Link>
    </div>
  )
}

export default NotFound