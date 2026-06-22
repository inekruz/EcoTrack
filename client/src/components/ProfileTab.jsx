import { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom'
import EditableField from '../components/EditableField';
import {
  FaUserCircle,
  FaPencilAlt,
  FaSave,
  FaTimes,
  FaWeightHanging,
  FaRulerCombined,
  FaBirthdayCake,
  FaTransgender,
  FaRunning,
  FaAppleAlt,
  FaFire,
  FaTint,
  FaHeartbeat,
  FaBolt,
  FaAward,
  FaChartLine,
  FaCalendarAlt,
  FaClock,
  FaUserFriends,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaGlobe,
  FaCheckCircle,
  FaDumbbell,
  FaBalanceScale,
  FaSignOutAlt
} from 'react-icons/fa';

function ProfileTab() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null);
  const [tempData, setTempData] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);

  const achievements = [
    {
      name: '30 дней трекинга',
      icon: <FaCalendarAlt />,
      earned: true
    },
    {
      name: 'Первые 5 кг',
      icon: <FaWeightHanging />,
      earned: true
    },
    {
      name: 'Спортсмен',
      icon: <FaDumbbell />,
      earned: false
    },
    {
      name: 'Здоровое сердце',
      icon: <FaHeartbeat />,
      earned: true
    }
  ];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get('/auth/profile');

      const profile = response.data;

      const formattedData = {
        name: profile?.username || '',
        email: profile?.email || '',
        phone: profile?.phone || '',
        location: profile?.location || '',
        bio: profile?.bio || '',
        avatar: profile?.avatar || null,

        gender: profile?.gender || 'male',
        weight: profile?.weight || 0,
        height: profile?.height || 0,
        age: profile?.age || 0,

        activityLevel: profile?.activity_level || 'moderate',
        goal: profile?.goal || 'maintain',

        waterGoal: profile?.water_goal || 2.5,
        sleepGoal: profile?.sleep_goal || 8,

        dailyCalories: profile?.daily_calories || 2200,

        joinDate: profile?.created_at || new Date(),

        statistics: {
          totalDays: 120,
          totalMeals: 850,
          totalCalories: 1870000,
          weightLost: 4.5,
          waterDrunk: 280
        }
      };

      setUserData(formattedData);
      setTempData(formattedData);
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setTempData({ ...userData });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await api.put('/auth/profile', {
        name: tempData.name,
        email: tempData.email,
        phone: tempData.phone,
        location: tempData.location,
        bio: tempData.bio,
        avatar: tempData.avatar,

        gender: tempData.gender,
        weight: tempData.weight,
        height: tempData.height,
        age: tempData.age,

        activity_level: tempData.activityLevel,
        goal: tempData.goal,

        water_goal: tempData.waterGoal,
        sleep_goal: tempData.sleepGoal,

        daily_calories: calculateMaintenanceCalories()
      });

      const updatedData = {
        ...tempData,
        dailyCalories: calculateMaintenanceCalories()
      };

      setUserData(updatedData);
      setTempData(updatedData);

      setIsEditing(false);

      alert('✅ Профиль успешно сохранён');
    } catch (error) {
      console.error(error);
      alert('Ошибка сохранения профиля');
    }
  };

  const handleCancel = () => {
    setTempData({ ...userData });
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setTempData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setAvatarPreview(reader.result);

      setTempData((prev) => ({
        ...prev,
        avatar: reader.result
      }));
    };

    reader.readAsDataURL(file);
  };

    const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/')
  }

  const calculateMaintenanceCalories = () => {
    if (!tempData.weight || !tempData.height || !tempData.age) {
      return 2200;
    }

    let bmr;

    if (tempData.gender === 'male') {
      bmr =
        88.362 +
        13.397 * tempData.weight +
        4.799 * tempData.height -
        5.677 * tempData.age;
    } else {
      bmr =
        447.593 +
        9.247 * tempData.weight +
        3.098 * tempData.height -
        4.33 * tempData.age;
    }

    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9
    };

    const goalMultipliers = {
      lose: 0.85,
      maintain: 1,
      gain: 1.15
    };

    const tdee =
      bmr *
      activityMultipliers[tempData.activityLevel || 'moderate'];

    return Math.round(
      tdee * goalMultipliers[tempData.goal || 'maintain']
    );
  };


  const activityLevels = {
    sedentary: {
      name: 'Сидячий',
      description: 'Минимум движения'
    },
    light: {
      name: 'Легкий',
      description: 'Тренировки 1-3 дня/неделю'
    },
    moderate: {
      name: 'Умеренный',
      description: 'Тренировки 3-5 дней/неделю'
    },
    active: {
      name: 'Высокий',
      description: 'Ежедневные тренировки'
    },
    veryActive: {
      name: 'Экстремальный',
      description: 'Интенсивные нагрузки'
    }
  };

  const goals = {
    lose: {
      name: 'Похудение',
      icon: <FaChartLine />,
      color: '#f59e0b'
    },
    maintain: {
      name: 'Поддержание',
      icon: <FaBalanceScale />,
      color: '#22c55e'
    },
    gain: {
      name: 'Набор массы',
      icon: <FaBolt />,
      color: '#3b82f6'
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        Загрузка профиля...
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="profile-loading">
        Не удалось загрузить профиль
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-cover"></div>

        <div className="profile-avatar-section">
          <div className="avatar-wrapper">
            <img
              src={
                avatarPreview ||
                userData.avatar ||
                'https://ui-avatars.com/api/?name=User&background=22c55e&color=fff&size=256'
              }
              alt="Avatar"
              className="avatar-image"
            />

            {isEditing && (
              <button
                className="avatar-edit-btn"
                onClick={() =>
                  document
                    .getElementById('avatar-input')
                    .click()
                }
              >
                <FaPencilAlt />
              </button>
            )}

            <input
              id="avatar-input"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </div>

          <div className="profile-name">
            {isEditing ? (
              <input
                type="text"
                value={tempData.name}
                onChange={(e) =>
                  handleInputChange(
                    'name',
                    e.target.value
                  )
                }
                className="name-input"
              />
            ) : (
              <h2>{userData.name}</h2>
            )}

            <p className="member-since">
              <FaCalendarAlt />
              {' '}Участник с{' '}
              {new Date(
                userData.joinDate
              ).toLocaleDateString('ru-RU')}
            </p>
          </div>
                <div className="sidebar-logout">
                <button
                  onClick={handleLogout}
                  className="sidebar-btn logout"
                >
                  <FaSignOutAlt />
                  <span>Выйти</span>
                </button>
              </div>
        </div>
      </div>

      <div className="profile-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <FaFire />
          </div>

          <div className="stat-info">
            <span className="stat-value">
              {userData.statistics.totalMeals}
            </span>

            <span className="stat-label">
              Приемов пищи
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaWeightHanging />
          </div>

          <div className="stat-info">
            <span className="stat-value">
              {userData.statistics.weightLost}
            </span>

            <span className="stat-label">
              Сброшено кг
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaTint />
          </div>

          <div className="stat-info">
            <span className="stat-value">
              {userData.statistics.waterDrunk}
            </span>

            <span className="stat-label">
              Выпито литров
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaCalendarAlt />
          </div>

          <div className="stat-info">
            <span className="stat-value">
              {userData.statistics.totalDays}
            </span>

            <span className="stat-label">
              Дней трекинга
            </span>
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-main-info">
          <div className="section-header">
            <div className="section-title">
              <FaUserFriends />
              {' '}Личная информация
            </div>

            {!isEditing ? (
              <button
                className="edit-btn"
                onClick={handleEdit}
              >
                <FaPencilAlt />
                {' '}Редактировать
              </button>
            ) : (
              <div className="edit-actions">
                <button
                  className="save-btn"
                  onClick={handleSave}
                >
                  <FaSave />
                  {' '}Сохранить
                </button>

                <button
                  className="cancel-btn"
                  onClick={handleCancel}
                >
                  <FaTimes />
                  {' '}Отмена
                </button>
              </div>
            )}
          </div>

      <EditableField
        label="Имя"
        value={userData.name}
        field="name"
        icon={<FaUserCircle />}

        isEditing={isEditing}
        tempData={tempData}
        handleInputChange={handleInputChange}
      />

      <EditableField
        label="Email"
        value={userData.email}
        field="email"
        type="email"
        icon={<FaEnvelope />}

        isEditing={isEditing}
        tempData={tempData}
        handleInputChange={handleInputChange}
      />

      <EditableField
        label="Телефон"
        value={userData.phone}
        field="phone"
        icon={<FaPhone />}

        isEditing={isEditing}
        tempData={tempData}
        handleInputChange={handleInputChange}
      />

      <EditableField
        label="Местоположение"
        value={userData.location}
        field="location"
        icon={<FaMapMarkerAlt />}

        isEditing={isEditing}
        tempData={tempData}
        handleInputChange={handleInputChange}
      />

          <div className="bio-section">
            <div className="bio-label">
              <FaGlobe />
              {' '}О себе
            </div>

            {isEditing ? (
              <textarea
                value={tempData.bio}
                onChange={(e) =>
                  handleInputChange(
                    'bio',
                    e.target.value
                  )
                }
                className="bio-input"
                rows="3"
              />
            ) : (
              <p className="bio-text">
                {userData.bio}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileTab;