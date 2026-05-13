import {
  FaFire,
  FaAppleAlt,
  FaHeartbeat,
  FaWater
} from 'react-icons/fa'

function OverviewTab() {

  const cards = [
    {
      title: 'Калории',
      value: '1840',
      icon: <FaFire />
    },
    {
      title: 'Белки',
      value: '97g',
      icon: <FaAppleAlt />
    },
    {
      title: 'Активность',
      value: '74%',
      icon: <FaHeartbeat />
    },
    {
      title: 'Вода',
      value: '1.8L',
      icon: <FaWater />
    }
  ]

  return (
    <div>

      <div className="stats-grid">

        {cards.map((card, index) => (
          <div
            key={index}
            className="stats-card"
          >
            <div className="stats-icon">
              {card.icon}
            </div>

            <h3>{card.value}</h3>

            <p>{card.title}</p>
          </div>
        ))}

      </div>

    </div>
  )
}

export default OverviewTab