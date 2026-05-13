import { useState } from 'react';
import { 
  FaMale, 
  FaFemale, 
  FaExchangeAlt, 
  FaFire, 
  FaAppleAlt, 
  FaDumbbell,
  FaBolt,
  FaChartLine,
  FaCalendarWeek,
  FaInfoCircle,
  FaTint,
  FaEgg,
  FaBreadSlice,
  FaCheese,
  FaFish,
  FaRegSmile,
  FaWeightHanging,
  FaRulerCombined,
  FaBirthdayCake,
  FaRunning,
  FaBullseye,
  FaPercentage,
  FaClock
} from 'react-icons/fa';

function CaloriesCalculator() {
  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    age: '',
    gender: 'male',
    activityLevel: 'moderate',
    goal: 'maintain'
  });

  const [result, setResult] = useState(null);
  const [weeklyResult, setWeeklyResult] = useState(null);

  // Коэффициенты активности (Harris-Benedict)
  const activityLevels = {
    sedentary: { name: 'Сидячий', multiplier: 1.2, desc: 'Минимум движения, сидячая работа' },
    light: { name: 'Легкий', multiplier: 1.375, desc: 'Легкие тренировки 1-3 дня в неделю' },
    moderate: { name: 'Умеренный', multiplier: 1.55, desc: 'Тренировки 3-5 дней в неделю' },
    active: { name: 'Высокий', multiplier: 1.725, desc: 'Интенсивные тренировки 6-7 дней в неделю' },
    veryActive: { name: 'Экстремальный', multiplier: 1.9, desc: 'Тяжелая физ. работа + спорт' }
  };

  // Коэффициенты для цели
  const goalCoeffs = {
    lose: { name: 'Похудение', multiplier: 0.85, desc: 'Дефицит 15%' },
    maintain: { name: 'Поддержание', multiplier: 1, desc: 'Баланс калорий' },
    gain: { name: 'Набор массы', multiplier: 1.15, desc: 'Профицит 15%' }
  };

  // Расчет BMR по формуле Харриса-Бенедикта (пересмотренная версия 1984)
  const calculateBMR = () => {
    const weightKg = parseFloat(formData.weight);
    const heightCm = parseFloat(formData.height);
    const ageYears = parseFloat(formData.age);

    if (formData.gender === 'male') {
      // Для мужчин: 88.362 + (13.397 × вес в кг) + (4.799 × рост в см) - (5.677 × возраст)
      return 88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * ageYears);
    } else {
      // Для женщин: 447.593 + (9.247 × вес в кг) + (3.098 × рост в см) - (4.330 × возраст)
      return 447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * ageYears);
    }
  };

  // Расчет макронутриентов с правильными коэффициентами
  const calculateMacros = (calories) => {
    switch (formData.goal) {
      case 'lose':
        return {
          protein: Math.round((calories * 0.35) / 4), // 35% белка
          fat: Math.round((calories * 0.25) / 9),     // 25% жиров
          carbs: Math.round((calories * 0.40) / 4)    // 40% углеводов
        };
      case 'gain':
        return {
          protein: Math.round((calories * 0.30) / 4), // 30% белка
          fat: Math.round((calories * 0.25) / 9),     // 25% жиров
          carbs: Math.round((calories * 0.45) / 4)    // 45% углеводов
        };
      default:
        return {
          protein: Math.round((calories * 0.30) / 4), // 30% белка
          fat: Math.round((calories * 0.25) / 9),     // 25% жиров
          carbs: Math.round((calories * 0.45) / 4)    // 45% углеводов
        };
    }
  };

  // Получение рекомендаций
  const getRecommendations = (bmr, calories, weight, tdee) => {
    const recommendations = [];
    const proteinPerKg = formData.goal === 'lose' ? 2.2 : (formData.goal === 'gain' ? 1.8 : 1.6);
    
    if (formData.goal === 'lose') {
      recommendations.push({
        icon: <FaDumbbell />,
        title: 'Оптимальный темп похудения',
        text: `Рекомендуемая скорость: 0.5-1 кг в неделю. Ваш дефицит: ${Math.round(tdee - calories)} ккал/день.`
      });
      recommendations.push({
        icon: <FaEgg />,
        title: 'Белок - основа',
        text: `Потребляйте ${Math.round(weight * proteinPerKg)} г белка в день (${Math.round(proteinPerKg * 4)} ккал) для сохранения мышечной массы.`
      });
      recommendations.push({
        icon: <FaBolt />,
        title: 'NEAT активность',
        text: 'Увеличьте повседневную активность: ходьба, подъем по лестнице, уборка - это сжигает до 500 ккал в день.'
      });
    } else if (formData.goal === 'gain') {
      recommendations.push({
        icon: <FaDumbbell />,
        title: 'Набор качественной массы',
        text: `Рекомендуемый профицит: 300-500 ккал/день. Ваш профицит: ${Math.round(calories - tdee)} ккал/день.`
      });
      recommendations.push({
        icon: <FaFish />,
        title: 'Правильные источники',
        text: 'Делайте упор на сложные углеводы (гречка, рис, овсянка) и качественные жиры (орехи, авокадо, рыба).'
      });
      recommendations.push({
        icon: <FaClock />,
        title: 'Режим питания',
        text: 'Питайтесь каждые 3-4 часа, не пропускайте приемы пищи. Добавьте протеин до/после тренировки.'
      });
    } else {
      recommendations.push({
        icon: <FaRegSmile />,
        title: 'Поддержание формы',
        text: 'Ваш вес будет стабильным. Следите за качеством пищи, а не только за калориями.'
      });
      recommendations.push({
        icon: <FaRunning />,
        title: 'Разнообразие тренировок',
        text: 'Сочетайте кардио (150 мин/неделю) и силовые тренировки (2-3 раза/неделю).'
      });
    }

    recommendations.push({
      icon: <FaTint />,
      title: 'Гидратация',
      text: `Пейте ${Math.round(weight * 0.03)}-${Math.round(weight * 0.04)} л воды в день. Вода ускоряет метаболизм на 24% на 1-1.5 часа.`
    });

    recommendations.push({
      icon: <FaChartLine />,
      title: 'Контроль прогресса',
      text: `Взвешивайтесь 1 раз в неделю утром натощак. Делайте замеры тела раз в 2 недели.`
    });

    return recommendations;
  };

  const calculate = () => {
    // Валидация
    if (!formData.weight || !formData.height || !formData.age) {
      alert('Пожалуйста, заполните все поля!');
      return;
    }

    if (formData.weight < 20 || formData.weight > 300) {
      alert('Пожалуйста, введите корректный вес (20-300 кг)');
      return;
    }

    if (formData.height < 50 || formData.height > 300) {
      alert('Пожалуйста, введите корректный рост (50-300 см)');
      return;
    }

    if (formData.age < 15 || formData.age > 120) {
      alert('Пожалуйста, введите корректный возраст (15-120 лет)');
      return;
    }

    // Расчет BMR
    const bmr = calculateBMR();
    
    // Расчет TDEE (Total Daily Energy Expenditure)
    const activityMultiplier = activityLevels[formData.activityLevel].multiplier;
    const tdee = Math.round(bmr * activityMultiplier);
    
    // Корректировка под цель
    const goalMultiplier = goalCoeffs[formData.goal].multiplier;
    const dailyCalories = Math.round(tdee * goalMultiplier);
    
    // Расчет макронутриентов
    const macros = calculateMacros(dailyCalories);
    
    // Расчет на неделю
    const weeklyCalories = dailyCalories * 7;
    const weeklyChange = (dailyCalories - tdee) * 7;
    const weightChangePerWeek = (weeklyChange / 7700).toFixed(2);
    
    let weeklyDescription = '';
    if (formData.goal === 'lose') {
      weeklyDescription = `Ожидаемая потеря: ${Math.abs(weightChangePerWeek)} кг в неделю`;
    } else if (formData.goal === 'gain') {
      weeklyDescription = `Ожидаемый набор: ${weightChangePerWeek} кг в неделю`;
    } else {
      weeklyDescription = 'Вес будет поддерживаться на стабильном уровне';
    }

    // Получение рекомендаций
    const recommendations = getRecommendations(bmr, dailyCalories, parseFloat(formData.weight), tdee);

    setResult({
      bmr: Math.round(bmr),
      tdee: tdee,
      daily: dailyCalories,
      macros: macros,
      recommendations: recommendations,
      activityName: activityLevels[formData.activityLevel].name,
      goalName: goalCoeffs[formData.goal].name,
      deficit: formData.goal === 'lose' ? Math.round(tdee - dailyCalories) : (formData.goal === 'gain' ? Math.round(dailyCalories - tdee) : 0)
    });

    setWeeklyResult({
      total: weeklyCalories,
      description: weeklyDescription,
      perMeal: Math.round(dailyCalories / 4),
      change: weeklyChange,
      weightChange: Math.abs(weightChangePerWeek)
    });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="calculator-wrapper">
      <div className="dashboard-card">
        <h2>
          <FaFire className="section-icon" /> 
          Калькулятор калорий
        </h2>
        <p className="calculator-subtitle">
          Рассчитайте вашу норму калорий по формуле Харриса-Бенедикта
        </p>

        <div className="calculator-form">
          <div className="form-row">
            <div className="form-group">
              <label><FaWeightHanging /> Вес (кг)</label>
              <input
                type="number"
                name="weight"
                placeholder="например: 70"
                value={formData.weight}
                onChange={handleInputChange}
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label><FaRulerCombined /> Рост (см)</label>
              <input
                type="number"
                name="height"
                placeholder="например: 175"
                value={formData.height}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label><FaBirthdayCake /> Возраст (лет)</label>
              <input
                type="number"
                name="age"
                placeholder="например: 25"
                value={formData.age}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Пол</label>
              <div className="gender-buttons">
                <button
                  type="button"
                  className={`gender-btn ${formData.gender === 'male' ? 'active' : ''}`}
                  onClick={() => setFormData({...formData, gender: 'male'})}
                >
                  <FaMale /> Мужской
                </button>
                <button
                  type="button"
                  className={`gender-btn ${formData.gender === 'female' ? 'active' : ''}`}
                  onClick={() => setFormData({...formData, gender: 'female'})}
                >
                  <FaFemale /> Женский
                </button>
              </div>
            </div>

            <div className="form-group">
              <label><FaRunning /> Уровень активности</label>
              <select
                name="activityLevel"
                value={formData.activityLevel}
                onChange={handleInputChange}
              >
                {Object.entries(activityLevels).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.name} - {value.desc}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label><FaBullseye /> Ваша цель</label>
              <select
                name="goal"
                value={formData.goal}
                onChange={handleInputChange}
              >
                {Object.entries(goalCoeffs).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.name} - {value.desc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button className="calculate-btn" onClick={calculate}>
            <FaExchangeAlt /> Рассчитать
          </button>
        </div>

        {result && (
          <div className="calculator-results">
            <div className="results-header">
              <h3>Ваши результаты</h3>
              <p>{result.activityName} уровень | Цель: {result.goalName}</p>
            </div>

            <div className="calories-grid">
              <div className="calorie-card">
                <div className="calorie-icon"><FaFire /></div>
                <div className="calorie-info">
                  <span className="calorie-label">BMR (базовый метаболизм)</span>
                  <span className="calorie-value">{result.bmr} ккал</span>
                  <small>Организм в состоянии покоя</small>
                </div>
              </div>

              <div className="calorie-card primary">
                <div className="calorie-icon"><FaBolt /></div>
                <div className="calorie-info">
                  <span className="calorie-label">Дневная норма</span>
                  <span className="calorie-value large">{result.daily} ккал</span>
                  <small>С учетом активности и цели</small>
                </div>
              </div>

              <div className="calorie-card">
                <div className="calorie-icon"><FaRunning /></div>
                <div className="calorie-info">
                  <span className="calorie-label">TDEE (общий расход)</span>
                  <span className="calorie-value">{result.tdee} ккал</span>
                  <small>Для поддержания веса</small>
                </div>
              </div>
            </div>

            {result.deficit > 0 && (
              <div className="deficit-alert" style={{backgroundColor: formData.goal === 'lose' ? '#fef3c7' : '#d1fae5', padding: '12px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center'}}>
                <span style={{fontWeight: 'bold'}}>
                  {formData.goal === 'lose' ? `📉 Дефицит: ${result.deficit} ккал/день` : `📈 Профицит: ${result.deficit} ккал/день`}
                </span>
              </div>
            )}

            <div className="macros-section">
              <h4>
                <FaAppleAlt /> Распределение БЖУ
              </h4>
              <div className="macros-grid">
                <div className="macro-item">
                  <div className="macro-icon"><FaEgg /></div>
                  <div className="macro-info">
                    <span className="macro-name">Белки</span>
                    <span className="macro-value">{result.macros.protein} г</span>
                    <span className="macro-percent">{Math.round(result.macros.protein * 4 / result.daily * 100)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: `${Math.round(result.macros.protein * 4 / result.daily * 100)}%`}}></div>
                  </div>
                </div>

                <div className="macro-item">
                  <div className="macro-icon"><FaCheese /></div>
                  <div className="macro-info">
                    <span className="macro-name">Жиры</span>
                    <span className="macro-value">{result.macros.fat} г</span>
                    <span className="macro-percent">{Math.round(result.macros.fat * 9 / result.daily * 100)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: `${Math.round(result.macros.fat * 9 / result.daily * 100)}%`}}></div>
                  </div>
                </div>

                <div className="macro-item">
                  <div className="macro-icon"><FaBreadSlice /></div>
                  <div className="macro-info">
                    <span className="macro-name">Углеводы</span>
                    <span className="macro-value">{result.macros.carbs} г</span>
                    <span className="macro-percent">{Math.round(result.macros.carbs * 4 / result.daily * 100)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: `${Math.round(result.macros.carbs * 4 / result.daily * 100)}%`}}></div>
                  </div>
                </div>
              </div>
            </div>

            {weeklyResult && (
              <div className="weekly-section">
                <h4>
                  <FaCalendarWeek /> Недельный прогноз
                </h4>
                <div className="weekly-card">
                  <div className="weekly-stats">
                    <div className="weekly-item">
                      <span className="weekly-label">Всего за неделю</span>
                      <span className="weekly-value">{weeklyResult.total.toLocaleString()} ккал</span>
                    </div>
                    <div className="weekly-item">
                      <span className="weekly-label">На 1 прием пищи</span>
                      <span className="weekly-value">{weeklyResult.perMeal} ккал</span>
                    </div>
                    <div className="weekly-item highlight">
                      <span className="weekly-label">Результат</span>
                      <span className="weekly-value">{weeklyResult.description}</span>
                    </div>
                    <div className="weekly-item">
                      <span className="weekly-label">Недельный дефицит/профицит</span>
                      <span className="weekly-value">{Math.abs(Math.round(weeklyResult.change))} ккал</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="recommendations-section">
              <h4>
                <FaInfoCircle /> Персональные рекомендации
              </h4>
              <div className="recommendations-grid">
                {result.recommendations.map((rec, index) => (
                  <div key={index} className="recommendation-card">
                    <div className="rec-icon">{rec.icon}</div>
                    <div className="rec-content">
                      <h5>{rec.title}</h5>
                      <p>{rec.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CaloriesCalculator;