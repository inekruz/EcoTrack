import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="not-found">
      <div id="center" className="not-found__center">
        <div className="not-found__code">404</div>

        <h1 className="not-found__title">Страница не найдена</h1>

        <p className="not-found__text">
          Возможно, она была удалена, переименована или никогда не существовала.
        </p>

        <div className="not-found__actions">
          <Link to="/" className="not-found__button">
            На главную
          </Link>

          <Link to="javascript:history.back()" className="not-found__button not-found__button--ghost">
            Назад
          </Link>
        </div>
      </div>

      <div className="not-found__glow" />
    </div>
  )
}

export default NotFound
