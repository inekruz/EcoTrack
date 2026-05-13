import { useState, useEffect } from 'react';
import { 
  FaPlus, 
  FaTrash, 
  FaEdit, 
  FaSave, 
  FaTimes,
  FaUtensils,
  FaAppleAlt,
  FaBarcode,
  FaCamera,
  FaKeyboard,
  FaCalendarDay,
  FaChevronLeft,
  FaChevronRight,
  FaSearch,
  FaFire,
  FaDumbbell,
  FaBreadSlice,
  FaRegClock,
  FaCheckCircle,
  FaHome
} from 'react-icons/fa';
import { 
  getFoodEntries, 
  addFoodEntry, 
  updateFoodEntry, 
  deleteFoodEntry
} from '../api';
import '../styles/diary.css';

function DiaryTab() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    meal_type: 'breakfast',
    eaten_at: new Date().toISOString().slice(0, 16),
    product_name: '',
    source_type: 'manual',
    portion_grams: 100,
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    manual_notes: ''
  });
  const [summary, setSummary] = useState({
    totalCalories: 0,
    totalProtein: 0,
    totalFat: 0,
    totalCarbs: 0
  });

  // Загрузка записей за выбранную дату
  const loadEntries = async (date) => {
    setLoading(true);
    try {
      const startDate = date.toISOString().split('T')[0];
      const endDate = date.toISOString().split('T')[0];
      const data = await getFoodEntries(startDate, endDate);
      setEntries(data);
      calculateSummary(data);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  // Подсчёт итогов за день
  const calculateSummary = (entriesData) => {
    const totals = entriesData.reduce((acc, entry) => ({
      totalCalories: acc.totalCalories + (entry.calories || 0),
      totalProtein: acc.totalProtein + (entry.protein || 0),
      totalFat: acc.totalFat + (entry.fat || 0),
      totalCarbs: acc.totalCarbs + (entry.carbs || 0)
    }), { totalCalories: 0, totalProtein: 0, totalFat: 0, totalCarbs: 0 });
    setSummary(totals);
  };

  useEffect(() => {
    loadEntries(selectedDate);
  }, [selectedDate]);

  // Смена даты
  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  // Сегодня
  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Форматирование даты
  const formatDate = (date) => {
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Проверка, сегодня ли выбранная дата
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Обработка формы
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'portion_grams' || name === 'calories' || name === 'protein' || name === 'fat' || name === 'carbs' 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  // Добавление/редактирование записи
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEntry) {
        const updated = await updateFoodEntry(editingEntry.id, formData);
        setEntries(prev => prev.map(entry => entry.id === editingEntry.id ? updated : entry));
        calculateSummary(entries.map(entry => entry.id === editingEntry.id ? updated : entry));
      } else {
        const newEntry = await addFoodEntry(formData);
        setEntries(prev => [...prev, newEntry]);
        calculateSummary([...entries, newEntry]);
      }
      resetModal();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Ошибка при сохранении записи');
    }
  };

  // Удаление записи
  const handleDelete = async (id) => {
    if (window.confirm('Удалить этот приём пищи?')) {
      try {
        await deleteFoodEntry(id);
        const newEntries = entries.filter(entry => entry.id !== id);
        setEntries(newEntries);
        calculateSummary(newEntries);
      } catch (error) {
        console.error('Ошибка удаления:', error);
        alert('Ошибка при удалении');
      }
    }
  };

  // Редактирование записи
  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      meal_type: entry.meal_type,
      eaten_at: entry.eaten_at.slice(0, 16),
      product_name: entry.product_name,
      source_type: entry.source_type,
      portion_grams: entry.portion_grams,
      calories: entry.calories,
      protein: entry.protein || 0,
      fat: entry.fat || 0,
      carbs: entry.carbs || 0,
      manual_notes: entry.manual_notes || ''
    });
    setShowAddModal(true);
  };

  // Сброс модального окна
  const resetModal = () => {
    setShowAddModal(false);
    setEditingEntry(null);
    setFormData({
      meal_type: 'breakfast',
      eaten_at: new Date().toISOString().slice(0, 16),
      product_name: '',
      source_type: 'manual',
      portion_grams: 100,
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      manual_notes: ''
    });
  };

  // Иконка для типа приёма пищи
  const getMealIcon = (mealType) => {
    switch(mealType) {
      case 'breakfast': return <FaAppleAlt />;
      case 'lunch': return <FaUtensils />;
      case 'dinner': return <FaBreadSlice />;
      default: return <FaRegClock />;
    }
  };

  const getMealName = (mealType) => {
    switch(mealType) {
      case 'breakfast': return 'Завтрак';
      case 'lunch': return 'Обед';
      case 'dinner': return 'Ужин';
      default: return 'Перекус';
    }
  };

  const getSourceIcon = (sourceType) => {
    switch(sourceType) {
      case 'barcode': return <FaBarcode size={12} />;
      case 'photo': return <FaCamera size={12} />;
      default: return <FaKeyboard size={12} />;
    }
  };

  const getSourceText = (sourceType) => {
    switch(sourceType) {
      case 'barcode': return 'по штрихкоду';
      case 'photo': return 'по фото';
      default: return 'ручной ввод';
    }
  };

  return (
    <div className="diary-container">
      {/* Статистика за день */}
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-icon"><FaFire /></div>
          <h3>{isNaN(summary.totalCalories) ? 0 : Math.round(summary.totalCalories)}</h3>
          <p>ккал</p>
        </div>
        <div className="stats-card">
          <div className="stats-icon"><FaDumbbell /></div>
          <h3>{isNaN(summary.totalProtein) ? 0 : Math.round(summary.totalProtein)} г</h3>
          <p>Белки</p>
        </div>
        <div className="stats-card">
          <div className="stats-icon"><FaBreadSlice /></div>
          <h3>{isNaN(summary.totalCarbs) ? 0 : Math.round(summary.totalCarbs)} г</h3>
          <p>Углеводы</p>
        </div>
        <div className="stats-card">
          <div className="stats-icon"><FaAppleAlt /></div>
          <h3>{isNaN(summary.totalFat) ? 0 : Math.round(summary.totalFat)} г</h3>
          <p>Жиры</p>
        </div>
      </div>

      {/* Навигация по датам */}
      <div className="date-navigation">
        <div className="date-nav-content">
          <button className="date-nav-btn" onClick={() => changeDate(-1)}>
            <FaChevronLeft /> Предыдущий день
          </button>
          
          <div className="date-display">
            <h3>{formatDate(selectedDate)}</h3>
            <p>{entries.length} записей</p>
          </div>
          
          <button className="date-nav-btn today-btn" onClick={goToToday}>
            <FaHome /> Сегодня
          </button>
          
          <button className="date-nav-btn" onClick={() => changeDate(1)}>
            Следующий день <FaChevronRight />
          </button>
        </div>
      </div>

      {/* Список приёмов пищи */}
      <div className="entries-card">
        <div className="card-header">
          <h2>
            <FaCalendarDay /> Приёмы пищи
            <span className="entries-count">{entries.length}</span>
          </h2>
          <button className="submit-btn" style={{ padding: '10px 20px', margin: 0 }} onClick={() => setShowAddModal(true)}>
            <FaPlus /> Добавить
          </button>
        </div>
        
        {loading ? (
          <div className="empty-state">
            <div className="empty-icon"><FaSearch /></div>
            <p>Загрузка...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><FaUtensils /></div>
            <h3>Нет записей</h3>
            <p>Добавьте свой первый приём пищи</p>
            <button className="submit-btn" onClick={() => setShowAddModal(true)}>
              <FaPlus /> Добавить приём пищи
            </button>
          </div>
        ) : (
          <div className="entries-list">
            {entries.map((entry) => (
              <div key={entry.id} className="entry-item">
                <div className="entry-info">
                  <div className="entry-icon">
                    {getMealIcon(entry.meal_type)}
                  </div>
                  <div className="entry-details">
                    <div className="entry-title">
                      <strong>{getMealName(entry.meal_type)}</strong>
                      <span className="entry-time">
                        <FaRegClock size={10} /> {new Date(entry.eaten_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="entry-product">
                      <span>{entry.product_name}</span>
                      <span className="source-badge">
                        {getSourceIcon(entry.source_type)} {getSourceText(entry.source_type)}
                      </span>
                    </div>
                    {entry.manual_notes && (
                      <div className="entry-notes">
                        📝 {entry.manual_notes}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="entry-stats">
                  <div className="calorie-badge">
                    <div className="calorie-value">
                      {isNaN(entry.calories) ? 0 : Math.round(entry.calories)} 
                      <span className="calorie-unit">ккал</span>
                    </div>
                    <div className="portion-value">{entry.portion_grams} г</div>
                  </div>
                  <div className="macro-badges">
                    <span className="macro-badge">
                      Б: {isNaN(entry.protein) ? 0 : Math.round(entry.protein || 0)}г
                    </span>
                    <span className="macro-badge">
                      Ж: {isNaN(entry.fat) ? 0 : Math.round(entry.fat || 0)}г
                    </span>
                    <span className="macro-badge">
                      У: {isNaN(entry.carbs) ? 0 : Math.round(entry.carbs || 0)}г
                    </span>
                  </div>
                </div>
                
                <div className="entry-actions">
                  <button className="action-btn edit-btn" onClick={() => handleEdit(entry)}>
                    <FaEdit /> <span>Изменить</span>
                  </button>
                  <button className="action-btn delete-btn" onClick={() => handleDelete(entry.id)}>
                    <FaTrash /> <span>Удалить</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модальное окно */}
      {showAddModal && (
        <div className="modal-overlay" onClick={resetModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {editingEntry ? <FaEdit /> : <FaPlus />}
                {editingEntry ? 'Редактировать' : 'Добавить'} приём пищи
              </h2>
              <button className="close-btn" onClick={resetModal}>
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="entry-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>🍽️ Тип приёма пищи</label>
                    <select name="meal_type" value={formData.meal_type} onChange={handleInputChange}>
                      <option value="breakfast">Завтрак</option>
                      <option value="lunch">Обед</option>
                      <option value="dinner">Ужин</option>
                      <option value="snack">Перекус</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>⏰ Время</label>
                    <input type="datetime-local" name="eaten_at" value={formData.eaten_at} onChange={handleInputChange} required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>🍲 Название продукта/блюда</label>
                    <input type="text" name="product_name" value={formData.product_name} onChange={handleInputChange} required placeholder="Например: Овсяная каша с ягодами" />
                  </div>
                  <div className="form-group">
                    <label>⚖️ Вес порции (г)</label>
                    <input type="number" name="portion_grams" value={formData.portion_grams} onChange={handleInputChange} required step="10" />
                  </div>
                </div>

                <div className="form-group">
                  <label>📱 Источник добавления</label>
                  <div className="method-switch">
                    <button type="button" className={`method-btn ${formData.source_type === 'manual' ? 'active' : ''}`} onClick={() => setFormData(prev => ({ ...prev, source_type: 'manual' }))}>
                      <FaKeyboard /> Ручной ввод
                    </button>
                    <button type="button" className={`method-btn ${formData.source_type === 'barcode' ? 'active' : ''}`} onClick={() => setFormData(prev => ({ ...prev, source_type: 'barcode' }))}>
                      <FaBarcode /> Штрихкод
                    </button>
                    <button type="button" className={`method-btn ${formData.source_type === 'photo' ? 'active' : ''}`} onClick={() => setFormData(prev => ({ ...prev, source_type: 'photo' }))}>
                      <FaCamera /> Фото
                    </button>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>🔥 Калории (ккал)</label>
                    <input type="number" name="calories" value={formData.calories} onChange={handleInputChange} required step="10" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>💪 Белки (г)</label>
                    <input type="number" name="protein" value={formData.protein} onChange={handleInputChange} step="1" />
                  </div>
                  <div className="form-group">
                    <label>🥑 Жиры (г)</label>
                    <input type="number" name="fat" value={formData.fat} onChange={handleInputChange} step="1" />
                  </div>
                  <div className="form-group">
                    <label>🍚 Углеводы (г)</label>
                    <input type="number" name="carbs" value={formData.carbs} onChange={handleInputChange} step="1" />
                  </div>
                </div>

                <div className="form-group">
                  <label>📝 Заметки (необязательно)</label>
                  <textarea name="manual_notes" value={formData.manual_notes} onChange={handleInputChange} placeholder="Дополнительная информация о блюде..." />
                </div>

                <button type="submit" className="submit-btn">
                  <FaSave /> {editingEntry ? 'Сохранить изменения' : 'Добавить запись'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DiaryTab;