import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  FaChartLine, 
  FaFire, 
  FaUtensils, 
  FaAppleAlt, 
  FaBarcode, 
  FaCamera, 
  FaKeyboard,
  FaTrophy, 
  FaMedal, 
  FaStar, 
  FaChartPie, 
  FaChartBar,
  FaBreadSlice, 
  FaRegClock,
  FaLeaf,
  FaDumbbell
} from 'react-icons/fa';
import { getStatistics } from '../api';
import '../styles/stat.css';

function StatisticsTab() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState('week');
  const [customRange, setCustomRange] = useState({
    start_date: '',
    end_date: ''
  });
  const [activeChart, setActiveChart] = useState('calories');

  const COLORS = {
    protein: '#3b82f6',
    fat: '#ef4444',
    carbs: '#22c55e',
    calories: '#38b26c',
    primary: '#38b26c',
    secondary: '#4ade80',
    accent: '#a855f7'
  };

  const PIE_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#38b26c', '#a855f7'];

  // Безопасное округление чисел
  const safeRound = (value, decimals = 0) => {
    if (value === undefined || value === null || isNaN(value)) return 0;
    const num = parseFloat(value);
    if (isNaN(num)) return 0;
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
  };

  // Безопасный toFixed
  const safeToFixed = (value, decimals = 0) => {
    const num = safeRound(value, decimals);
    return num.toFixed(decimals);
  };

  const loadStatistics = async () => {
    setLoading(true);
    try {
      let data;
      if (customRange.start_date && customRange.end_date) {
        data = await getStatistics(null, customRange.start_date, customRange.end_date);
      } else {
        data = await getStatistics(period);
      }
      setStats(data);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, [period, customRange.start_date, customRange.end_date]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const formatXAxis = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (period === 'week') {
      return date.toLocaleDateString('ru-RU', { weekday: 'short' });
    }
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const getMealName = (type) => {
    switch(type) {
      case 'breakfast': return 'Завтрак';
      case 'lunch': return 'Обед';
      case 'dinner': return 'Ужин';
      case 'snack': return 'Перекус';
      default: return type || 'Другое';
    }
  };

  const getCaloriesChartData = () => {
    if (!stats?.daily_stats || !Array.isArray(stats.daily_stats)) return [];
    return stats.daily_stats.map(day => ({
      date: day.date,
      calories: safeRound(day.total_calories || 0),
      meals: safeRound(day.meals_count || 0)
    }));
  };

  const getMacroChartData = () => {
    if (!stats?.daily_stats || !Array.isArray(stats.daily_stats)) return [];
    return stats.daily_stats.map(day => ({
      date: day.date,
      protein: safeRound(day.total_protein || 0),
      fat: safeRound(day.total_fat || 0),
      carbs: safeRound(day.total_carbs || 0)
    }));
  };

  const getMacroPieData = () => {
    if (!stats?.total_stats) return [];
    const total = (stats.total_stats.total_protein || 0) + 
                  (stats.total_stats.total_fat || 0) + 
                  (stats.total_stats.total_carbs || 0);
    if (total === 0) return [];
    return [
      { name: 'Белки', value: safeRound(stats.total_stats.total_protein || 0), color: COLORS.protein },
      { name: 'Жиры', value: safeRound(stats.total_stats.total_fat || 0), color: COLORS.fat },
      { name: 'Углеводы', value: safeRound(stats.total_stats.total_carbs || 0), color: COLORS.carbs }
    ];
  };

  const getMealsDistributionData = () => {
    if (!stats?.meals_distribution || !Array.isArray(stats.meals_distribution)) return [];
    return stats.meals_distribution.map(item => ({
      name: getMealName(item.meal_type),
      value: safeRound(item.total_calories || 0),
      count: item.count || 0
    }));
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--card)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>{label}</p>
          {payload.map((p, idx) => (
            <p key={idx} style={{ color: p.color, margin: '4px 0' }}>
              {p.name}: {safeRound(p.value)} {p.unit || ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Загрузка статистики...</p>
      </div>
    );
  }

  return (
    <div className="statistics-container">
      <div className="period-navigation">
        <div className="period-tabs">
          <button className={`period-tab ${period === 'week' ? 'active' : ''}`} onClick={() => { setPeriod('week'); setCustomRange({ start_date: '', end_date: '' }); }}>
            Неделя
          </button>
          <button className={`period-tab ${period === 'month' ? 'active' : ''}`} onClick={() => { setPeriod('month'); setCustomRange({ start_date: '', end_date: '' }); }}>
            Месяц
          </button>
          <button className={`period-tab ${period === 'year' ? 'active' : ''}`} onClick={() => { setPeriod('year'); setCustomRange({ start_date: '', end_date: '' }); }}>
            Год
          </button>
        </div>
        
        <div className="custom-range">
          <div className="date-inputs">
            <input type="date" className="date-input" value={customRange.start_date} onChange={(e) => setCustomRange(prev => ({ ...prev, start_date: e.target.value }))} />
            <span>—</span>
            <input type="date" className="date-input" value={customRange.end_date} onChange={(e) => setCustomRange(prev => ({ ...prev, end_date: e.target.value }))} />
          </div>
          <button className="apply-btn" onClick={() => { setPeriod('custom'); loadStatistics(); }}>
            Применить
          </button>
        </div>
      </div>

      <div className="stats-grid-4">
        <div className="stat-big-card">
          <div className="stat-big-icon"><FaFire /></div>
          <div className="stat-big-value">{safeRound(stats?.total_stats?.total_calories || 0).toLocaleString()}</div>
          <div className="stat-big-label">Всего ккал</div>
          <div className="stat-big-sub">за период</div>
        </div>
        <div className="stat-big-card">
          <div className="stat-big-icon"><FaUtensils /></div>
          <div className="stat-big-value">{safeRound(stats?.total_stats?.total_meals || 0)}</div>
          <div className="stat-big-label">Приёмов пищи</div>
          <div className="stat-big-sub">{safeRound(stats?.total_stats?.days_count || 0)} дней</div>
        </div>
        <div className="stat-big-card">
          <div className="stat-big-icon"><FaChartLine /></div>
          <div className="stat-big-value">{safeRound(stats?.total_stats?.avg_daily_calories || 0).toLocaleString()}</div>
          <div className="stat-big-label">Средняя калорийность</div>
          <div className="stat-big-sub">ккал в день</div>
        </div>
        <div className="stat-big-card">
          <div className="stat-big-icon"><FaAppleAlt /></div>
          <div className="stat-big-value">
            {safeToFixed(stats?.macro_profile?.protein_percentage || 0, 0)}% / 
            {safeToFixed(stats?.macro_profile?.fat_percentage || 0, 0)}% / 
            {safeToFixed(stats?.macro_profile?.carbs_percentage || 0, 0)}%
          </div>
          <div className="stat-big-label">Б/Ж/У</div>
          <div className="stat-big-sub">среднее соотношение</div>
        </div>
      </div>

      <div className="charts-grid-2">
        <div className="chart-card">
          <div className="chart-header">
            <h3><FaChartLine className="chart-icon" /> Динамика калорийности</h3>
            <div className="method-switch" style={{ padding: 0, background: 'transparent', gap: '8px' }}>
              <button className={`method-btn ${activeChart === 'calories' ? 'active' : ''}`} onClick={() => setActiveChart('calories')} style={{ padding: '6px 12px' }}>Калории</button>
              <button className={`method-btn ${activeChart === 'meals' ? 'active' : ''}`} onClick={() => setActiveChart('meals')} style={{ padding: '6px 12px' }}>Приёмы</button>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              {activeChart === 'calories' ? (
                <AreaChart data={getCaloriesChartData()}>
                  <defs>
                    <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tickFormatter={formatXAxis} stroke="var(--text-light)" />
                  <YAxis stroke="var(--text-light)" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="calories" stroke={COLORS.primary} fill="url(#colorCalories)" strokeWidth={2} />
                </AreaChart>
              ) : (
                <BarChart data={getCaloriesChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tickFormatter={formatXAxis} stroke="var(--text-light)" />
                  <YAxis stroke="var(--text-light)" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="meals" fill={COLORS.secondary} radius={[8, 8, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3><FaChartPie className="chart-icon" /> Распределение БЖУ</h3>
          </div>
          <div className="macro-pie-container">
            <div className="pie-chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getMacroPieData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${safeToFixed((percent || 0) * 100, 0)}%`}
                    labelLine={false}
                  >
                    {getMacroPieData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="macro-legend">
              <div className="legend-item"><div className="legend-color protein"></div><span>Белки</span><span className="legend-value">{safeRound(stats?.total_stats?.total_protein || 0)} г</span></div>
              <div className="legend-item"><div className="legend-color fat"></div><span>Жиры</span><span className="legend-value">{safeRound(stats?.total_stats?.total_fat || 0)} г</span></div>
              <div className="legend-item"><div className="legend-color carbs"></div><span>Углеводы</span><span className="legend-value">{safeRound(stats?.total_stats?.total_carbs || 0)} г</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="charts-grid-2">
        <div className="chart-card">
          <div className="chart-header">
            <h3><FaChartBar className="chart-icon" /> Динамика БЖУ</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getMacroChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tickFormatter={formatXAxis} stroke="var(--text-light)" />
                <YAxis stroke="var(--text-light)" />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="protein" stroke={COLORS.protein} strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="fat" stroke={COLORS.fat} strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="carbs" stroke={COLORS.carbs} strokeWidth={2} dot={{ r: 4 }} />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3><FaRegClock className="chart-icon" /> Калории по приёмам пищи</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getMealsDistributionData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${safeToFixed((percent || 0) * 100, 0)}%`}
                  labelLine={false}
                >
                  {getMealsDistributionData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${safeRound(value)} ккал`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="charts-grid-2">
        <div className="chart-card">
          <div className="chart-header">
            <h3><FaStar className="chart-icon" /> Чаще всего в рационе</h3>
          </div>
          <div className="top-products-list">
            {stats?.top_products && Array.isArray(stats.top_products) && stats.top_products.slice(0, 5).map((product, idx) => (
              <div key={idx} className="product-item">
                <div className="product-rank">{idx + 1}</div>
                <div className="product-info">
                  <div className="product-name">{product.product_name || 'Без названия'}</div>
                  <div className="product-stats">
                    <span>{safeRound(product.frequency || 0)} раз</span>
                    <span>~{safeRound(product.avg_calories || 0)} ккал</span>
                  </div>
                </div>
                <div className="product-bar">{safeRound(product.total_calories || 0)} ккал</div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3><FaTrophy className="chart-icon" /> Самые калорийные дни</h3>
          </div>
          <div className="top-days-list">
            {stats?.top_days && Array.isArray(stats.top_days) && stats.top_days.map((day, idx) => (
              <div key={idx} className="day-item">
                <div className="day-date">{formatDate(day.date)}</div>
                <div className="day-calories">{safeRound(day.total_calories || 0)} ккал</div>
                <div className="day-meals">{safeRound(day.meals_count || 0)} приёмов</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="achievements-section">
        <div className="chart-card">
          <div className="chart-header">
            <h3><FaMedal className="chart-icon" /> Ваши достижения</h3>
          </div>
          <div className="achievements-grid">
            <div className="achievement-card">
              <div className="achievement-icon">📅</div>
              <div className="achievement-title">{safeRound(stats?.total_stats?.days_count || 0)}</div>
              <div className="achievement-label">активных дней</div>
            </div>
            <div className="achievement-card">
              <div className="achievement-icon">🍽️</div>
              <div className="achievement-title">{safeRound(stats?.total_stats?.total_meals || 0)}</div>
              <div className="achievement-label">всего приёмов</div>
            </div>
            <div className="achievement-card">
              <div className="achievement-icon">⭐</div>
              <div className="achievement-title">{safeRound(stats?.daily_stats?.length || 0)}</div>
              <div className="achievement-label">дней с записями</div>
            </div>
            <div className="achievement-card">
              <div className="achievement-icon">🎯</div>
              <div className="achievement-title">{safeRound(stats?.macro_profile?.avg_calories || 0)}</div>
              <div className="achievement-label">средняя ккал/приём</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatisticsTab;