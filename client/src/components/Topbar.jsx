import {
  FaBell
} from 'react-icons/fa'

function Topbar() {
  return (
    <header className="topbar">

      <div>
        <h1>
          Dashboard
        </h1>

        <p>
          Контроль питания и здоровья
        </p>
      </div>

      <button className="notification-btn">
        <FaBell />
      </button>

    </header>
  )
}

export default Topbar