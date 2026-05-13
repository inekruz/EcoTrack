import { useState, useRef, useEffect } from 'react';
import api from '../api';
import { 
  FaCamera, 
  FaBarcode, 
  FaUpload, 
  FaCheckCircle,
  FaExclamationTriangle,
  FaRedoAlt,
  FaCameraRetro,
  FaStop,
  FaInfoCircle,
  FaSpinner,
  FaShoppingBasket,
  FaClipboardList,
  FaLeaf,
  FaWeightHanging,
  FaFire,
  FaTint,
  FaEgg,
  FaCheese,
  FaBreadSlice,
  FaFish,
  FaAppleAlt,
  FaCarrot,
  FaBoxOpen,
  FaTag,
  FaClock,
  FaChartLine,
  FaStar,
  FaSmile,
  FaStore,
  FaQuestionCircle,
  FaKeyboard,
  FaCheck,
  FaTimes,
  FaUtensils,
  FaGlassWhiskey,
  FaPercentage
} from 'react-icons/fa';

function ScannerTab() {
  const [scanMethod, setScanMethod] = useState('photo');
  const [scanning, setScanning] = useState(false);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [error, setError] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState({ checking: true, available: false });
  const [manualBarcode, setManualBarcode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const scanIntervalRef = useRef(null);

  const searchProductByBarcode = async (barcode) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/products/${barcode}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 1 && data.product) {
        const product = data.product;
        const nutriments = product.nutriments || {};
        
        const productInfo = {
          barcode: barcode,
          name: product.product_name || product.generic_name || 'Название не указано',
          brand: product.brands || 'Не указан',
          quantity: product.quantity || 'Не указано',
          categories: product.categories || 'Не указаны',
          image: product.image_front_url || product.image_url || null,
          categoryIcon: getCategoryIcon(product.categories),
          nutriments: {
            calories: nutriments['energy-kcal_100g'] || nutriments.energy_100g || 0,
            protein: nutriments.proteins_100g || 0,
            fat: nutriments.fat_100g || 0,
            carbs: nutriments.carbohydrates_100g || 0,
            sugars: nutriments.sugars_100g || 0,
            fiber: nutriments.fiber_100g || 0,
            salt: nutriments.salt_100g || 0
          },
          ingredients: product.ingredients_text || 'Информация отсутствует',
          additives: product.additives_tags || [],
          allergens: product.allergens_tags || [],
          labels: product.labels_tags || [],
          nutriscore: product.nutrition_grades || null,
          timestamp: new Date().toLocaleString(),
          type: 'barcode',
          source: 'Open Food Facts'
        };
        
        setScannedProduct(productInfo);
        setShowManualInput(false);
        setManualBarcode('');
      } else {
        setError(`Продукт с штрихкодом ${barcode} не найден в базе Open Food Facts.`);
        setScannedProduct(null);
      }
    } catch (err) {
      console.error('Ошибка API:', err);
      setError('Не удалось получить данные о продукте. Проверьте подключение к интернету.');
    } finally {
      setIsLoading(false);
    }
  };

  // Получение категории иконки
  const getCategoryIcon = (categories) => {
    if (!categories) return <FaBoxOpen />;
    const cat = categories.toLowerCase();
    if (cat.includes('milk') || cat.includes('dairy')) return <FaGlassWhiskey />;
    if (cat.includes('bread')) return <FaBreadSlice />;
    if (cat.includes('fruit')) return <FaAppleAlt />;
    if (cat.includes('vegetable')) return <FaCarrot />;
    if (cat.includes('meat')) return <FaFish />;
    if (cat.includes('fish')) return <FaFish />;
    if (cat.includes('drink') || cat.includes('beverage')) return <FaTint />;
    return <FaBoxOpen />;
  };

  // Запрос разрешения на камеру
  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission(true);
      return true;
    } catch (err) {
      console.error('Ошибка доступа к камере:', err);
      setCameraPermission(false);
      setError('Не удалось получить доступ к камере. Пожалуйста, разрешите доступ к камере в настройках браузера.');
      return false;
    }
  };

  // Запуск сканера
  const startScanner = async () => {
    setError(null);
    setScannedProduct(null);
    setShowManualInput(false);
    
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;
    
    setScanning(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new BarcodeDetector({ 
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39'] 
        });
        
        scanIntervalRef.current = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = videoRef.current.videoWidth;
              canvas.height = videoRef.current.videoHeight;
              const context = canvas.getContext('2d');
              context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
              
              const detections = await barcodeDetector.detect(canvas);
              if (detections.length > 0) {
                stopScanner();
                await searchProductByBarcode(detections[0].rawValue);
              }
            } catch (err) {
              console.error('Ошибка детекции:', err);
            }
          }
        }, 500);
      } else {
        setError('Ваш браузер не поддерживает сканирование штрихкодов. Пожалуйста, используйте ручной ввод или загрузку фото.');
        stopScanner();
      }
    } catch (err) {
      console.error('Ошибка запуска сканера:', err);
      setError('Не удалось запустить сканер. Пожалуйста, попробуйте ручной ввод.');
      setScanning(false);
    }
  };

  // Остановка сканера
  const stopScanner = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setScanning(false);
  };

  // Ручной ввод штрихкода
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualBarcode.trim()) {
      setError('Пожалуйста, введите штрихкод');
      return;
    }
    
    const barcodeRegex = /^\d{8,14}$/;
    if (!barcodeRegex.test(manualBarcode.trim())) {
      setError('Неверный формат штрихкода. Штрихкод должен содержать 8-14 цифр.');
      return;
    }
    
    await searchProductByBarcode(manualBarcode.trim());
  };

  // Обработка изменения поля ввода
  const handleManualBarcodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 14) {
      setManualBarcode(value);
      setError(null);
    }
  };

  // Обработка загрузки изображения со штрихкодом
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setSelectedImage(URL.createObjectURL(file));
    setError(null);
    setScannedProduct(null);
    setShowManualInput(false);
    setIsLoading(true);
    
    try {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const context = canvas.getContext('2d');
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        if ('BarcodeDetector' in window) {
          const barcodeDetector = new BarcodeDetector({ 
            formats: ['ean_13', 'ean_8', 'code_128', 'code_39'] 
          });
          const detections = await barcodeDetector.detect(canvas);
          
          if (detections.length > 0) {
            await searchProductByBarcode(detections[0].rawValue);
          } else {
            setError('Не удалось распознать штрихкод на изображении. Пожалуйста, введите штрихкод вручную.');
            setShowManualInput(true);
          }
        } else {
          setError('Ваш браузер не поддерживает распознавание штрихкодов. Пожалуйста, введите штрихкод вручную.');
          setShowManualInput(true);
        }
        
        setIsLoading(false);
        URL.revokeObjectURL(img.src);
      };
    } catch (err) {
      console.error('Ошибка:', err);
      setError('Не удалось распознать штрихкод на изображении.');
      setIsLoading(false);
    }
  };

  // AI анализ фото блюда (имитация)
  const analyzeFoodPhoto = async (file) => {
    setIsLoading(true);
    
    setTimeout(() => {
      const mockAnalyses = [
        {
          name: 'Овсяная каша с фруктами',
          calories: 320,
          protein: 12,
          fat: 8,
          carbs: 52,
          confidence: 0.92,
          icon: <FaBreadSlice size={64} />,
          type: 'ai-analysis',
          source: 'AI Analysis (Demo)'
        },
        {
          name: 'Греческий салат',
          calories: 250,
          protein: 8,
          fat: 18,
          carbs: 12,
          confidence: 0.88,
          icon: <FaCarrot size={64} />,
          type: 'ai-analysis',
          source: 'AI Analysis (Demo)'
        },
        {
          name: 'Куриная грудка с рисом',
          calories: 450,
          protein: 35,
          fat: 12,
          carbs: 45,
          confidence: 0.95,
          icon: <FaUtensils size={64} />,
          type: 'ai-analysis',
          source: 'AI Analysis (Demo)'
        }
      ];
      
      const randomAnalysis = mockAnalyses[Math.floor(Math.random() * mockAnalyses.length)];
      
      setScannedProduct({
        ...randomAnalysis,
        timestamp: new Date().toLocaleString(),
        barcode: null
      });
      
      setIsLoading(false);
    }, 2000);
  };

  const handleFoodPhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setSelectedImage(URL.createObjectURL(file));
    setError(null);
    setScannedProduct(null);
    await analyzeFoodPhoto(file);
  };

  // Очистка результатов
  const clearResults = () => {
    setScannedProduct(null);
    setError(null);
    setSelectedImage(null);
    setManualBarcode('');
    setShowManualInput(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Добавление продукта в дневник
  const addToDiary = (product) => {
    alert(`✅ Продукт добавлен в дневник питания!
    
📦 ${product.name}
${product.brand && product.brand !== 'Не указан' ? `🏷️ Бренд: ${product.brand}` : ''}
${product.barcode ? `🔢 Штрихкод: ${product.barcode}` : ''}
🔥 ${product.nutriments?.calories || product.calories} ккал
🥩 Белки: ${product.nutriments?.protein || product.protein} г
🧈 Жиры: ${product.nutriments?.fat || product.fat} г
🍚 Углеводы: ${product.nutriments?.carbs || product.carbs} г
${product.source ? `\n📡 Источник: ${product.source}` : ''}
    
Время: ${product.timestamp}`);
    clearResults();
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="scanner-wrapper">
      <div className="dashboard-card scanner-card">
        {!apiStatus.checking && apiStatus.available && (
          <div className="api-status success">
            <FaCheckCircle /> Open Food Facts API подключен
          </div>
        )}
        {!apiStatus.checking && !apiStatus.available && (
          <div className="api-status warning">
            <FaExclamationTriangle /> API недоступен, используются демо-данные
          </div>
        )}

        <div className="method-switch">
          <button 
            className={scanMethod === 'photo' ? 'active' : ''}
            onClick={() => {
              setScanMethod('photo');
              stopScanner();
              clearResults();
            }}
          >
            <FaCamera /> AI Анализ фото
          </button>
          <button 
            className={scanMethod === 'barcode' ? 'active' : ''}
            onClick={() => {
              setScanMethod('barcode');
              stopScanner();
              clearResults();
            }}
          >
            <FaBarcode /> Штрихкод
          </button>
        </div>

        {scanMethod === 'photo' ? (
          <div className="photo-analysis">
            <FaCamera className="scanner-icon" />
            <h2>AI Анализ блюда</h2>
            <p>Загрузите фотографию блюда для анализа калорийности и состава</p>
            
            <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
              <FaUpload className="upload-icon" />
              <div className="upload-text">
                <strong>Нажмите для загрузки</strong> или перетащите фото сюда
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFoodPhotoUpload}
                style={{ display: 'none' }}
                ref={fileInputRef}
              />
            </div>
          </div>
        ) : (
          <div className="barcode-scanner">
            <FaBarcode className="scanner-icon" />
            <h2>Сканер штрихкода</h2>
            <p>Наведите камеру на штрихкод, загрузите фото или введите вручную</p>
            
            {!scanning && !scannedProduct && !error && !isLoading && !showManualInput && (
              <div className="scanner-buttons">
                <button className="primary-btn" onClick={startScanner}>
                  <FaCameraRetro /> Запустить сканер
                </button>
                <button className="secondary-btn" onClick={() => fileInputRef.current?.click()}>
                  <FaUpload /> Загрузить фото
                </button>
                <button className="secondary-btn" onClick={() => setShowManualInput(true)}>
                  <FaKeyboard /> Ввести вручную
                </button>
              </div>
            )}

            {/* Форма ручного ввода */}
            {showManualInput && !scanning && (
              <div className="manual-input-form">
                <div className="manual-input-header">
                  <FaKeyboard />
                  <h3>Ручной ввод штрихкода</h3>
                </div>
                <form onSubmit={handleManualSubmit}>
                  <div className="input-group">
                    <input
                      type="text"
                      placeholder="Введите 8-14 цифр штрихкода"
                      value={manualBarcode}
                      onChange={handleManualBarcodeChange}
                      autoFocus
                      className="barcode-input"
                    />
                    <div className="input-actions">
                      <button type="submit" className="submit-btn" disabled={!manualBarcode}>
                        <FaCheck /> Найти
                      </button>
                      <button type="button" className="cancel-btn" onClick={() => {
                        setShowManualInput(false);
                        setManualBarcode('');
                        setError(null);
                      }}>
                        <FaTimes /> Отмена
                      </button>
                    </div>
                  </div>
                </form>
                <div className="input-hint">
                  <FaInfoCircle />
                  <span>Примеры: 4810099043255, 4607096360009</span>
                </div>
              </div>
            )}
            
            <div className={`scanner-container ${scanning ? 'active' : ''}`}>
              <video ref={videoRef} className="scanner-video" playsInline autoPlay></video>
              <div className="scanner-overlay">
                <div className="scanner-frame"></div>
              </div>
            </div>
            
            {scanning && (
              <div className="scanning-controls">
                <button className="control-btn" onClick={() => {
                  stopScanner();
                  setShowManualInput(true);
                }}>
                  <FaKeyboard /> Ввести вручную
                </button>
                <button className="control-btn stop" onClick={stopScanner}>
                  <FaStop /> Остановить
                </button>
              </div>
            )}
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
          ref={scanMethod === 'barcode' ? (el) => { if (el && !fileInputRef.current) fileInputRef.current = el; } : null}
        />

        {isLoading && (
          <div className="loading-container">
            <FaSpinner className="spinner-large" />
            <p>Поиск информации о продукте...</p>
          </div>
        )}

        {scannedProduct && !isLoading && (
          <div className="scan-result">
            <div className="scan-result-header">
              <FaCheckCircle className="success-icon" />
              <h3>{scannedProduct.type === 'ai-analysis' ? '🍽️ Блюдо распознано!' : '📦 Продукт найден!'}</h3>
            </div>
            
            <div className="product-info">
              {scannedProduct.image && (
                <img src={scannedProduct.image} alt={scannedProduct.name} className="product-image" />
              )}
              {!scannedProduct.image && scannedProduct.icon && (
                <div className="product-icon">{scannedProduct.icon}</div>
              )}
              {!scannedProduct.image && !scannedProduct.icon && scannedProduct.categoryIcon && (
                <div className="product-icon">{scannedProduct.categoryIcon}</div>
              )}
              <div className="product-details">
                <h4>{scannedProduct.name}</h4>
                {scannedProduct.barcode && (
                  <p className="product-barcode"><FaBarcode /> Штрихкод: {scannedProduct.barcode}</p>
                )}
                {scannedProduct.brand && scannedProduct.brand !== 'Не указан' && (
                  <p className="product-brand"><FaStore /> {scannedProduct.brand}</p>
                )}
                {scannedProduct.quantity && (
                  <p className="product-weight"><FaWeightHanging /> {scannedProduct.quantity}</p>
                )}
                {scannedProduct.source && (
                  <p className="product-source"><FaQuestionCircle /> {scannedProduct.source}</p>
                )}
                {scannedProduct.type === 'ai-analysis' && (
                  <p className="confidence"><FaStar /> Точность: {(scannedProduct.confidence * 100).toFixed(0)}%</p>
                )}
                {scannedProduct.nutriscore && (
                  <p className={`nutriscore nutriscore-${scannedProduct.nutriscore}`}>
                    <FaChartLine /> Nutri-Score: {scannedProduct.nutriscore.toUpperCase()}
                  </p>
                )}
              </div>
            </div>

            {scannedProduct.categories && (
              <div className="product-categories">
                <FaClipboardList /> {scannedProduct.categories}
              </div>
            )}
            
            <div className="nutritional-info">
              <div className="nutrient-item">
                <span className="nutrient-label"><FaFire /> Калории</span>
                <span className="nutrient-value">
                  {scannedProduct.nutriments?.calories || scannedProduct.calories} ккал
                </span>
              </div>
              <div className="nutrient-item">
                <span className="nutrient-label"><FaEgg /> Белки</span>
                <span className="nutrient-value">
                  {scannedProduct.nutriments?.protein || scannedProduct.protein} г
                </span>
              </div>
              <div className="nutrient-item">
                <span className="nutrient-label"><FaCheese /> Жиры</span>
                <span className="nutrient-value">
                  {scannedProduct.nutriments?.fat || scannedProduct.fat} г
                </span>
              </div>
              <div className="nutrient-item">
                <span className="nutrient-label"><FaBreadSlice /> Углеводы</span>
                <span className="nutrient-value">
                  {scannedProduct.nutriments?.carbs || scannedProduct.carbs} г
                </span>
              </div>
            </div>

            {scannedProduct.nutriments && (
              <div className="extra-nutrition">
                {scannedProduct.nutriments.fiber > 0 && (
                  <div className="extra-item">
                    <FaLeaf /> Клетчатка: {scannedProduct.nutriments.fiber} г
                  </div>
                )}
                {scannedProduct.nutriments.sugars > 0 && (
                  <div className="extra-item">
                    <FaSmile /> Сахар: {scannedProduct.nutriments.sugars} г
                  </div>
                )}
                {scannedProduct.nutriments.salt > 0 && (
                  <div className="extra-item">
                    <FaTint /> Соль: {scannedProduct.nutriments.salt} г
                  </div>
                )}
              </div>
            )}
            
            <div className="scan-actions">
              <button className="add-btn" onClick={() => addToDiary(scannedProduct)}>
                + Добавить в дневник
              </button>
              <button className="clear-btn" onClick={clearResults}>
                ✕ Очистить
              </button>
            </div>
          </div>
        )}

        {error && !isLoading && !showManualInput && (
          <div className="error-message">
            <FaExclamationTriangle className="error-icon" />
            <div className="error-content">
              <h4>⚠️ Ошибка</h4>
              <p>{error}</p>
              <div className="error-actions">
                {!cameraPermission && (
                  <button className="retry-btn" onClick={requestCameraPermission}>
                    <FaRedoAlt /> Повторить запрос
                  </button>
                )}
                <button className="retry-btn" onClick={() => setShowManualInput(true)}>
                  <FaKeyboard /> Ввести вручную
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ScannerTab;