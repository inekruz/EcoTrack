import {
  FaHome,
  FaUtensils,
  FaCamera,
  FaChartLine,
  FaUser,
  FaCalendar
} from 'react-icons/fa'

function Sidebar({
  activeTab,
  setActiveTab
}) {

  const menu = [
    {
      id: 'overview',
      title: 'Главная',
      icon: <FaHome />
    },
    {
      id: 'diary',
      title: 'Дневник',
      icon: <FaCalendar />
    },
    {
      id: 'nutrition',
      title: 'Питание',
      icon: <FaUtensils />
    },
    {
      id: 'scanner',
      title: 'AI Сканер',
      icon: <FaCamera />
    },
    {
      id: 'statistics',
      title: 'Статистика',
      icon: <FaChartLine />
    },
    {
      id: 'profile',
      title: 'Профиль',
      icon: <FaUser />
    }
  ]

  return (
    <aside className="sidebar">

      <div className="sidebar-logo">
        EcoTrack
      </div>

      <nav className="sidebar-menu">

        {menu.map((item) => (
          <button
            key={item.id}
            onClick={() =>
              setActiveTab(item.id)
            }
            className={
              activeTab === item.id
                ? 'sidebar-btn active'
                : 'sidebar-btn'
            }
          >
            {item.icon}
            <span>{item.title}</span>
          </button>
        ))}

      </nav>

    </aside>
  )
}

export default Sidebar