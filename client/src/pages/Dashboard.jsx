import { useState } from 'react';
import { FaBarcode, FaCalculator, FaChartLine, FaUser, FaCalendar } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import OverviewTab from '../components/OverviewTab';
import DiaryTab from '../components/DiaryTab';
import ScannerTab from '../components/ScannerTab';
import StatisticsTab from '../components/StatisticsTab';
import ProfileTab from '../components/ProfileTab';
import CaloriesCalculator from '../components/CaloriesCalculator';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('scanner');

  const tabs = [
    { id: 'scanner', label: 'Сканнер', icon: <FaBarcode /> },
    { id: 'diary', label: 'Дневник', icon: <FaCalendar /> },
    { id: 'calculator', label: 'Калькулятор', icon: <FaCalculator /> },
    { id: 'charts', label: 'Графики', icon: <FaChartLine /> },
    { id: 'profile', label: 'Профиль', icon: <FaUser /> },
  ];

  // Функция для рендера активного компонента
  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'scanner':
        return <ScannerTab />;
      case 'diary':
        return <DiaryTab />;
      case 'calculator':
        return <CaloriesCalculator />;
      case 'charts':
        return <StatisticsTab />;
      case 'profile':
        return <ProfileTab />;
      default:
        return <ScannerTab />;
    }
  };

  return (
    <div className="dashboard">
      {/* Боковое меню (десктоп) */}
      <aside className="sidebar">
        <div className="logo">EcoTrack</div>
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`menu-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} <span>{tab.label}</span>
          </div>
        ))}
      </aside>

      {/* Основной контент */}
      <main className="dashboard-content">
        <div className="tab-content">
          {renderActiveComponent()}
        </div>
      </main>

      {/* Мобильное меню */}
      <nav className="mobile-menu">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`mobile-menu-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default Dashboard;