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
  FaChartLine,
  FaStar,
  FaSmile,
  FaStore,
  FaQuestionCircle,
  FaKeyboard,
  FaCheck,
  FaTimes,
  FaUtensils,
  FaGlassWhiskey
} from 'react-icons/fa';

function ScannerTab() {
  const [scanMethod, setScanMethod] = useState('barcode');
  const [scanning, setScanning] = useState(false);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [error, setError] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState({ checking: true, available: false });
  const [manualBarcode, setManualBarcode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [isScanningPaused, setIsScanningPaused] = useState(false);
  const [browserSupport, setBrowserSupport] = useState({ barcodeDetector: false, mediaDevices: false });
  const [scanProgress, setScanProgress] = useState(0);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const barcodeFileInputRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // Проверка поддержки браузера
  useEffect(() => {
    const checkSupport = () => {
      const support = {
        barcodeDetector: 'BarcodeDetector' in window,
        mediaDevices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
      };
      setBrowserSupport(support);
      
      if (!support.mediaDevices) {
        setError('Ваш браузер не поддерживает доступ к камере. Используйте загрузку фото или ручной ввод.');
      }
    };
    checkSupport();
  }, []);

  // Проверка API
  useEffect(() => {
    const checkApi = async () => {
      try {
        const response = await api.get('/products/4607096360009');
        setApiStatus({ checking: false, available: response.status === 200 });
      } catch (error) {
        console.error('API check failed:', error);
        setApiStatus({ checking: false, available: false });
      }
    };
    checkApi();
  }, []);

  // Альтернативное распознавание через QuaggaJS (загружается динамически)
  const loadQuaggaJS = () => {
    return new Promise((resolve, reject) => {
      if (window.Quagga) {
        resolve(window.Quagga);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/quagga@0.12.1/dist/quagga.min.js';
      script.onload = () => {
        if (window.Quagga) {
          resolve(window.Quagga);
        } else {
          reject(new Error('Quagga не загрузился'));
        }
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const searchProductByBarcode = async (barcode) => {
    setIsLoading(true);
    setError(null);
    setScanProgress(30);
    
    try {
      // Проверяем кеш
      const cachedProduct = sessionStorage.getItem(`product_${barcode}`);
      if (cachedProduct) {
        const product = JSON.parse(cachedProduct);
        setScannedProduct(product);
        setIsLoading(false);
        setScanProgress(100);
        return;
      }

      setScanProgress(50);
      const response = await api.get(`/products/${barcode}`);
      setScanProgress(70);
      
      if (response.status === 200) {
        const data = response.data;
        
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
          
          sessionStorage.setItem(`product_${barcode}`, JSON.stringify(productInfo));
          setScannedProduct(productInfo);
          setShowManualInput(false);
          setManualBarcode('');
          setScanProgress(100);
        } else {
          setError(`Продукт с штрихкодом ${barcode} не найден в базе Open Food Facts.`);
          setScannedProduct(null);
          setScanProgress(0);
        }
      } else {
        setError(`Не удалось найти продукт. Попробуйте позже.`);
        setScannedProduct(null);
        setScanProgress(0);
      }
    } catch (err) {
      console.error('Ошибка API:', err);
      setError('Не удалось получить данные о продукте. Проверьте подключение к интернету.');
      setScannedProduct(null);
      setScanProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

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

  const requestCameraPermission = async () => {
    if (!browserSupport.mediaDevices) {
      setError('Ваш браузер не поддерживает доступ к камере.');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission(true);
      setError(null);
      return true;
    } catch (err) {
      console.error('Ошибка доступа к камере:', err);
      setCameraPermission(false);
      setError('Не удалось получить доступ к камере. Пожалуйста, разрешите доступ к камере в настройках браузера.');
      return false;
    }
  };

  // Оптимизированный метод сканирования с использованием BarcodeDetector
  const scanWithBarcodeDetector = async () => {
    try {
      const barcodeDetector = new BarcodeDetector({ 
        formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'codabar']
      });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50;
        
        scanIntervalRef.current = setInterval(async () => {
          attempts++;
          if (attempts > maxAttempts || isScanningPaused) {
            return;
          }
          
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            try {
              canvas.width = videoRef.current.videoWidth || 640;
              canvas.height = videoRef.current.videoHeight || 480;
              
              // Отзеркаливание камеры для правильного отображения
              context.save();
              context.translate(canvas.width, 0);
              context.scale(-1, 1);
              context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
              context.restore();
              
              const detections = await barcodeDetector.detect(canvas);
              if (detections && detections.length > 0) {
                const barcode = detections[0].rawValue;
                if (barcode && barcode.length >= 8) {
                  stopScanner();
                  resolve(barcode);
                }
              }
            } catch (err) {
              console.error('Ошибка детекции:', err);
            }
          }
        }, 300); // Уменьшил интервал для более быстрого сканирования
      });
    } catch (err) {
      console.error('BarcodeDetector не поддерживается:', err);
      return null;
    }
  };

  // Метод сканирования с использованием QuaggaJS
  const scanWithQuagga = async () => {
    try {
      const Quagga = await loadQuaggaJS();
      
      return new Promise((resolve) => {
        // Настройка Quagga с поддержкой зеркалирования
        Quagga.init({
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: videoRef.current,
            constraints: {
              facingMode: "environment",
              width: 640,
              height: 480
            },
          },
          decoder: {
            readers: [
              "ean_reader",
              "ean_8_reader",
              "code_128_reader",
              "code_39_reader",
              "upc_reader",
              "upc_e_reader"
            ]
          },
          locator: {
            patchSize: "medium",
            halfSample: true
          },
          // Включаем зеркалирование для правильного отображения
          mirror: true
        }, (err) => {
          if (err) {
            console.error('Quagga init error:', err);
            resolve(null);
            return;
          }
          
          Quagga.start();
          
          Quagga.onDetected((result) => {
            if (result && result.codeResult && result.codeResult.code) {
              const barcode = result.codeResult.code;
              if (barcode && barcode.length >= 8) {
                Quagga.stop();
                stopScanner();
                resolve(barcode);
              }
            }
          });
        });
        
        // Таймаут на случай если Quagga не найдет штрихкод
        setTimeout(() => {
          try {
            Quagga.stop();
          } catch (e) {}
          resolve(null);
        }, 30000);
      });
    } catch (err) {
      console.error('Quagga error:', err);
      return null;
    }
  };

  const startScanner = async () => {
    setError(null);
    setScannedProduct(null);
    setShowManualInput(false);
    setIsScanningPaused(false);
    
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;
    
    setScanning(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      let barcode = null;
      
      // Пробуем использовать BarcodeDetector
      if (browserSupport.barcodeDetector) {
        barcode = await scanWithBarcodeDetector();
      }
      
      // Если BarcodeDetector не сработал, пробуем Quagga
      if (!barcode) {
        barcode = await scanWithQuagga();
      }
      
      if (barcode) {
        await searchProductByBarcode(barcode);
      } else {
        setError('Не удалось распознать штрихкод. Попробуйте загрузить фото или ввести вручную.');
        setShowManualInput(true);
      }
    } catch (err) {
      console.error('Ошибка запуска сканера:', err);
      setError('Не удалось запустить сканер. Пожалуйста, попробуйте загрузить фото или ручной ввод.');
      setScanning(false);
    }
  };

  const stopScanner = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    if (window.Quagga) {
      try {
        window.Quagga.stop();
      } catch (e) {}
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setScanning(false);
    setIsScanningPaused(false);
  };

  const toggleScanning = () => {
    setIsScanningPaused(!isScanningPaused);
  };

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

  const handleManualBarcodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 14) {
      setManualBarcode(value);
      setError(null);
    }
  };

  // Распознавание штрихкода на изображении
  const detectBarcodeFromImage = async (imageData) => {
    // Метод 1: BarcodeDetector
    if (browserSupport.barcodeDetector) {
      try {
        const barcodeDetector = new BarcodeDetector({ 
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e']
        });
        const detections = await barcodeDetector.detect(imageData);
        if (detections && detections.length > 0) {
          return detections[0].rawValue;
        }
      } catch (err) {
        console.error('BarcodeDetector error:', err);
      }
    }
    
    // Метод 2: QuaggaJS для изображений
    try {
      const Quagga = await loadQuaggaJS();
      
      return new Promise((resolve) => {
        Quagga.decodeSingle({
          src: imageData.src || imageData,
          numOfWorkers: 0,
          inputStream: {
            size: 800
          },
          decoder: {
            readers: ["ean_reader", "ean_8_reader", "code_128_reader", "code_39_reader", "upc_reader"]
          }
        }, (result) => {
          if (result && result.codeResult && result.codeResult.code) {
            resolve(result.codeResult.code);
          } else {
            resolve(null);
          }
        });
      });
    } catch (err) {
      console.error('Quagga image error:', err);
      return null;
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const objectUrl = URL.createObjectURL(file);
    setSelectedImage(objectUrl);
    setError(null);
    setScannedProduct(null);
    setShowManualInput(false);
    setIsLoading(true);
    setScanProgress(10);
    
    try {
      const img = new Image();
      img.src = objectUrl;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      setScanProgress(30);
      
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const context = canvas.getContext('2d');
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      setScanProgress(50);
      
      const barcode = await detectBarcodeFromImage(canvas);
      setScanProgress(70);
      
      if (barcode) {
        await searchProductByBarcode(barcode);
      } else {
        setError('Не удалось распознать штрихкод на изображении. Пожалуйста, введите штрихкод вручную.');
        setShowManualInput(true);
        setScanProgress(0);
      }
      
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error('Ошибка:', err);
      setError('Не удалось распознать штрихкод на изображении.');
      setScanProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeFoodPhoto = async (file) => {
    setIsLoading(true);
    setScanProgress(10);
    
    // Имитация AI анализа
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
          source: 'AI Analysis (Demo)',
          nutriments: {
            calories: 320,
            protein: 12,
            fat: 8,
            carbs: 52,
            sugars: 15,
            fiber: 6,
            salt: 0.5
          }
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
          source: 'AI Analysis (Demo)',
          nutriments: {
            calories: 250,
            protein: 8,
            fat: 18,
            carbs: 12,
            sugars: 5,
            fiber: 4,
            salt: 0.8
          }
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
          source: 'AI Analysis (Demo)',
          nutriments: {
            calories: 450,
            protein: 35,
            fat: 12,
            carbs: 45,
            sugars: 3,
            fiber: 3,
            salt: 1.2
          }
        }
      ];
      
      const randomAnalysis = mockAnalyses[Math.floor(Math.random() * mockAnalyses.length)];
      setScanProgress(100);
      
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

  const clearResults = () => {
    setScannedProduct(null);
    setError(null);
    setSelectedImage(null);
    setManualBarcode('');
    setShowManualInput(false);
    setScanProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (barcodeFileInputRef.current) {
      barcodeFileInputRef.current.value = '';
    }
  };

  const addToDiary = (product) => {
    alert(`✅ Продукт добавлен в дневник питания!
    
📦 ${product.name}
${product.brand && product.brand !== 'Не указан' ? `🏷️ Бренд: ${product.brand}` : ''}
${product.barcode ? `🔢 Штрихкод: ${product.barcode}` : ''}
🔥 ${product.nutriments?.calories || product.calories || 0} ккал
🥩 Белки: ${product.nutriments?.protein || product.protein || 0} г
🧈 Жиры: ${product.nutriments?.fat || product.fat || 0} г
🍚 Углеводы: ${product.nutriments?.carbs || product.carbs || 0} г
${product.source ? `\n📡 Источник: ${product.source}` : ''}
    
Время: ${product.timestamp}`);
    clearResults();
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  // Компонент индикатора прогресса
  const ProgressBar = () => {
    if (scanProgress === 0) return null;
    return (
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${scanProgress}%` }}>
          <span className="progress-text">{scanProgress}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="scanner-wrapper">
      <div className="dashboard-card scanner-card">
        {/* Информация о поддержке браузера */}
        <div className="browser-support-info">
          {!browserSupport.mediaDevices && (
            <div className="api-status warning">
              <FaExclamationTriangle /> Камера не поддерживается. Используйте загрузку фото.
            </div>
          )}
          {browserSupport.mediaDevices && !browserSupport.barcodeDetector && (
            <div className="api-status info">
              <FaInfoCircle /> Используется альтернативный метод распознавания (QuaggaJS)
            </div>
          )}
        </div>

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
            className={scanMethod === 'barcode' ? 'active' : ''}
            onClick={() => {
              setScanMethod('barcode');
              stopScanner();
              clearResults();
            }}
          >
            <FaBarcode /> Штрихкод
          </button>
          <button 
            className={scanMethod === 'photo' ? 'active' : ''}
            onClick={() => {
              setScanMethod('photo');
              stopScanner();
              clearResults();
            }}
          >
            <FaCamera /> AI Анализ
          </button>
        </div>

        {scanMethod === 'barcode' ? (
          <div className="barcode-scanner">
            <FaBarcode className="scanner-icon" />
            <h2>Сканер штрихкода</h2>
            <p>
              {browserSupport.mediaDevices 
                ? 'Наведите камеру на штрихкод, загрузите фото или введите вручную'
                : 'Загрузите фото штрихкода или введите вручную'}
            </p>
            
            {!scanning && !scannedProduct && !error && !isLoading && !showManualInput && (
              <div className="scanner-buttons">
                {browserSupport.mediaDevices && (
                  <button className="primary-btn" onClick={startScanner}>
                    <FaCameraRetro /> Запустить сканер
                  </button>
                )}
                <button className="secondary-btn" onClick={() => barcodeFileInputRef.current?.click()}>
                  <FaUpload /> Загрузить фото
                </button>
                <button className="secondary-btn" onClick={() => setShowManualInput(true)}>
                  <FaKeyboard /> Ввести вручную
                </button>
              </div>
            )}

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
              <video 
                ref={videoRef} 
                className="scanner-video mirrored"
                playsInline 
                autoPlay
                muted
                style={{ 
                  display: scanning ? 'block' : 'none',
                  transform: 'scaleX(-1)' // Постоянное зеркалирование
                }}
              />
              {!scanning && !showManualInput && (
                <div className="scanner-placeholder">
                  <FaBarcode size={48} />
                  <p>
                    {browserSupport.mediaDevices 
                      ? 'Нажмите "Запустить сканер" для начала'
                      : 'Загрузите фото штрихкода'}
                  </p>
                </div>
              )}
              {scanning && (
                <div className="scanner-overlay">
                  <div className="scanner-frame"></div>
                  <div className="scanning-hint">Наведите на штрихкод</div>
                </div>
              )}
            </div>
            
            {scanning && (
              <div className="scanning-controls">
                <button className="control-btn" onClick={toggleScanning}>
                  {isScanningPaused ? '▶️ Продолжить' : '⏸️ Пауза'}
                </button>
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
        ) : (
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
            
            {selectedImage && scanMethod === 'photo' && (
              <div className="preview-image">
                <img src={selectedImage} alt="Загруженное фото" />
              </div>
            )}
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
          ref={barcodeFileInputRef}
        />

        {isLoading && (
          <div className="loading-container">
            <FaSpinner className="spinner-large" />
            <p>Поиск информации о продукте...</p>
            <ProgressBar />
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
                {scannedProduct.quantity && scannedProduct.quantity !== 'Не указано' && (
                  <p className="product-weight"><FaWeightHanging /> {scannedProduct.quantity}</p>
                )}
                {scannedProduct.source && (
                  <p className="product-source"><FaQuestionCircle /> {scannedProduct.source}</p>
                )}
                {scannedProduct.type === 'ai-analysis' && scannedProduct.confidence && (
                  <p className="confidence"><FaStar /> Точность: {(scannedProduct.confidence * 100).toFixed(0)}%</p>
                )}
                {scannedProduct.nutriscore && (
                  <p className={`nutriscore nutriscore-${scannedProduct.nutriscore}`}>
                    <FaChartLine /> Nutri-Score: {scannedProduct.nutriscore.toUpperCase()}
                  </p>
                )}
              </div>
            </div>

            {scannedProduct.categories && scannedProduct.categories !== 'Не указаны' && (
              <div className="product-categories">
                <FaClipboardList /> {scannedProduct.categories}
              </div>
            )}
            
            <div className="nutritional-info">
              <div className="nutrient-item">
                <span className="nutrient-label"><FaFire /> Калории</span>
                <span className="nutrient-value">
                  {scannedProduct.nutriments?.calories || scannedProduct.calories || 0} ккал
                </span>
              </div>
              <div className="nutrient-item">
                <span className="nutrient-label"><FaEgg /> Белки</span>
                <span className="nutrient-value">
                  {scannedProduct.nutriments?.protein || scannedProduct.protein || 0} г
                </span>
              </div>
              <div className="nutrient-item">
                <span className="nutrient-label"><FaCheese /> Жиры</span>
                <span className="nutrient-value">
                  {scannedProduct.nutriments?.fat || scannedProduct.fat || 0} г
                </span>
              </div>
              <div className="nutrient-item">
                <span className="nutrient-label"><FaBreadSlice /> Углеводы</span>
                <span className="nutrient-value">
                  {scannedProduct.nutriments?.carbs || scannedProduct.carbs || 0} г
                </span>
              </div>
            </div>

            {(scannedProduct.nutriments?.fiber > 0 || scannedProduct.nutriments?.sugars > 0 || scannedProduct.nutriments?.salt > 0) && (
              <div className="extra-nutrition">
                {scannedProduct.nutriments?.fiber > 0 && (
                  <div className="extra-item">
                    <FaLeaf /> Клетчатка: {scannedProduct.nutriments.fiber} г
                  </div>
                )}
                {scannedProduct.nutriments?.sugars > 0 && (
                  <div className="extra-item">
                    <FaSmile /> Сахар: {scannedProduct.nutriments.sugars} г
                  </div>
                )}
                {scannedProduct.nutriments?.salt > 0 && (
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
                {!cameraPermission && scanMethod === 'barcode' && browserSupport.mediaDevices && (
                  <button className="retry-btn" onClick={requestCameraPermission}>
                    <FaRedoAlt /> Повторить запрос
                  </button>
                )}
                <button className="retry-btn" onClick={() => setShowManualInput(true)}>
                  <FaKeyboard /> Ввести вручную
                </button>
                <button className="retry-btn" onClick={() => barcodeFileInputRef.current?.click()}>
                  <FaUpload /> Загрузить фото
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