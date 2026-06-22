import { useState, useRef, useEffect } from 'react';
import api, { 
  analyzeFoodPhotoBase64,  // Изменено на base64 версию
  getProductByBarcode,
  addFoodEntry 
} from '../api';
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
  FaGlassWhiskey,
  FaExpand,
  FaCompress,
  FaListUl,
  FaInfo,
  FaClock,
  FaTag
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
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [focusMode, setFocusMode] = useState('continuous');
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null);
  const [showIngredients, setShowIngredients] = useState(false);
  const [showAllergens, setShowAllergens] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    nutrition: true,
    ingredients: false,
    allergens: false,
    details: false
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const barcodeFileInputRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const animationFrameRef = useRef(null);
  const imageRef = useRef(null);
  const lastDetectedBarcode = useRef(null);
  const detectionCount = useRef(0);

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

  // ЕДИНСТВЕННАЯ ФУНКЦИЯ searchProductByBarcode
  const searchProductByBarcode = async (barcode) => {
    setIsLoading(true);
    setError(null);
    setScanProgress(30);
    
    try {
      const cachedProduct = sessionStorage.getItem(`product_${barcode}`);
      if (cachedProduct) {
        const product = JSON.parse(cachedProduct);
        setScannedProduct(product);
        setIsLoading(false);
        setScanProgress(100);
        return;
      }

      setScanProgress(50);
      
      // Используем функцию из api.js
      const data = await getProductByBarcode(barcode);
      setScanProgress(70);
      
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
          width: { ideal: 1280 },
          height: { ideal: 720 }
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

  // Улучшенная функция отображения видео с зумом и фокусом
  const drawMirroredVideo = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { 
      willReadFrequently: true,
      alpha: false
    });
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const videoWidth = video.videoWidth || 1280;
      const videoHeight = video.videoHeight || 720;
      
      // Устанавливаем размеры canvas с учетом зума
      const zoomFactor = isZoomed ? 1.5 : 1;
      const displayWidth = Math.min(videoWidth, 800);
      const displayHeight = (displayWidth / videoWidth) * videoHeight;
      
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      
      // Очищаем canvas
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Рассчитываем область для зума (центр изображения)
      const cropWidth = videoWidth / zoomFactor;
      const cropHeight = videoHeight / zoomFactor;
      const startX = (videoWidth - cropWidth) / 2;
      const startY = (videoHeight - cropHeight) / 2;
      
      // Рисуем зеркальное изображение с зумом
      context.save();
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
      
      if (isZoomed) {
        // Приближенный режим - обрезаем и масштабируем
        context.drawImage(
          video, 
          startX, startY, cropWidth, cropHeight,
          0, 0, canvas.width, canvas.height
        );
      } else {
        // Обычный режим
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      
      context.restore();
      
      // Применяем улучшение контрастности для лучшего распознавания
      if (scanning && !isScanningPaused) {
        enhanceImageContrast(context, canvas.width, canvas.height);
      }
    }
    
    // Продолжаем анимацию
    if (scanning && !isScanningPaused) {
      animationFrameRef.current = requestAnimationFrame(drawMirroredVideo);
    }
  };

  // Улучшение контрастности изображения
  const enhanceImageContrast = (context, width, height) => {
    try {
      const imageData = context.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      // Увеличиваем контрастность
      const contrast = 1.2;
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      
      for (let i = 0; i < data.length; i += 4) {
        data[i] = factor * (data[i] - 128) + 128;
        data[i+1] = factor * (data[i+1] - 128) + 128;
        data[i+2] = factor * (data[i+2] - 128) + 128;
      }
      
      context.putImageData(imageData, 0, 0);
    } catch (e) {
      // Игнорируем ошибки контрастности
    }
  };

  // Функция для попытки фокусировки
  const tryFocus = async () => {
    if (!streamRef.current) return;
    
    try {
      const track = streamRef.current.getVideoTracks()[0];
      if (track && track.getCapabilities) {
        const capabilities = track.getCapabilities();
        
        // Пытаемся установить фокус
        if (capabilities.focusMode) {
          await track.applyConstraints({
            advanced: [
              { focusMode: 'continuous' },
              { zoom: isZoomed ? 2.0 : 1.0 }
            ]
          });
        }
      }
    } catch (err) {
      console.log('Focus not supported:', err);
    }
  };

  // Улучшенный метод сканирования с BarcodeDetector
  const scanWithBarcodeDetector = async () => {
    try {
      const barcodeDetector = new BarcodeDetector({ 
        formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'codabar', 'code_93', 'itf']
      });
      
      return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 100;
        let bestBarcode = null;
        let bestConfidence = 0;
        
        scanIntervalRef.current = setInterval(async () => {
          attempts++;
          if (attempts > maxAttempts || isScanningPaused || !canvasRef.current) {
            if (bestBarcode && bestConfidence > 2) {
              stopScanner();
              resolve(bestBarcode);
            }
            return;
          }
          
          try {
            const detections = await barcodeDetector.detect(canvasRef.current);
            
            if (detections && detections.length > 0) {
              // Ищем наиболее вероятный штрихкод
              for (const detection of detections) {
                const barcode = detection.rawValue;
                const confidence = detection.cornerPoints ? 1 : 0;
                
                if (barcode && barcode.length >= 8) {
                  // Проверяем, не повторяется ли штрихкод
                  if (barcode === lastDetectedBarcode.current) {
                    detectionCount.current++;
                    // Если штрихкод обнаружен несколько раз подряд, считаем его правильным
                    if (detectionCount.current >= 3) {
                      stopScanner();
                      resolve(barcode);
                      return;
                    }
                  } else {
                    lastDetectedBarcode.current = barcode;
                    detectionCount.current = 1;
                  }
                  
                  // Сохраняем лучший результат
                  if (barcode.length >= 8 && barcode.length > bestConfidence) {
                    bestBarcode = barcode;
                    bestConfidence = barcode.length;
                  }
                }
              }
            }
          } catch (err) {
            console.error('Ошибка детекции:', err);
          }
        }, 200);
      });
    } catch (err) {
      console.error('BarcodeDetector не поддерживается:', err);
      return null;
    }
  };

  // Метод сканирования с QuaggaJS (улучшенный)
  const scanWithQuagga = async () => {
    try {
      const Quagga = await loadQuaggaJS();
      
      return new Promise((resolve) => {
        Quagga.init({
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: videoRef.current,
            constraints: {
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 },
              aspectRatio: { ideal: 1.7777777778 }
            },
          },
          decoder: {
            readers: [
              "ean_reader",
              "ean_8_reader",
              "code_128_reader",
              "code_39_reader",
              "upc_reader",
              "upc_e_reader",
              "codabar_reader",
              "code_93_reader"
            ],
            multiple: false
          },
          locator: {
            patchSize: "large",
            halfSample: true
          },
          numOfWorkers: 4
        }, (err) => {
          if (err) {
            console.error('Quagga init error:', err);
            resolve(null);
            return;
          }
          
          Quagga.start();
          
          let detectionCount = 0;
          let lastBarcode = null;
          
          Quagga.onDetected((result) => {
            if (result && result.codeResult && result.codeResult.code) {
              const barcode = result.codeResult.code;
              if (barcode && barcode.length >= 8) {
                if (barcode === lastBarcode) {
                  detectionCount++;
                  if (detectionCount >= 2) {
                    Quagga.stop();
                    stopScanner();
                    resolve(barcode);
                  }
                } else {
                  lastBarcode = barcode;
                  detectionCount = 1;
                }
              }
            }
          });
        });
        
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
    lastDetectedBarcode.current = null;
    detectionCount.current = 0;
    
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;
    
    setScanning(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          aspectRatio: { ideal: 1.7777777778 }
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        await tryFocus();
        
        drawMirroredVideo();
      }
      
      let barcode = null;
      
      if (browserSupport.barcodeDetector) {
        barcode = await scanWithBarcodeDetector();
      }
      
      if (!barcode) {
        barcode = await scanWithQuagga();
      }
      
      if (barcode) {
        await searchProductByBarcode(barcode);
      } else {
        setError('Не удалось распознать штрихкод. Попробуйте приблизить камеру или загрузить фото.');
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
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
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
    
    if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    
    setScanning(false);
    setIsScanningPaused(false);
    lastDetectedBarcode.current = null;
    detectionCount.current = 0;
  };

  const toggleScanning = () => {
    setIsScanningPaused(!isScanningPaused);
    if (!isScanningPaused) {
      drawMirroredVideo();
    }
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
    setZoomLevel(isZoomed ? 1 : 1.5);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    
    try {
      const track = streamRef.current.getVideoTracks()[0];
      if (track && track.getCapabilities) {
        const capabilities = track.getCapabilities();
        if (capabilities.torch) {
          await track.applyConstraints({
            advanced: [{ torch: !torchOn }]
          });
          setTorchOn(!torchOn);
        }
      }
    } catch (err) {
      console.log('Torch not supported:', err);
    }
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

  // Распознавание штрихкода на изображении (улучшенное)
  const detectBarcodeFromImage = async (imageData) => {
    // Метод 1: BarcodeDetector
    if (browserSupport.barcodeDetector) {
      try {
        const barcodeDetector = new BarcodeDetector({ 
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'codabar', 'code_93', 'itf']
        });
        const detections = await barcodeDetector.detect(imageData);
        if (detections && detections.length > 0) {
          for (const detection of detections) {
            if (detection.rawValue && detection.rawValue.length >= 8) {
              return detection.rawValue;
            }
          }
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
          numOfWorkers: 4,
          inputStream: {
            size: 800
          },
          decoder: {
            readers: ["ean_reader", "ean_8_reader", "code_128_reader", "code_39_reader", "upc_reader", "codabar_reader"]
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
        setError('Не удалось распознать штрихкод на изображении. Попробуйте загрузить более четкое фото.');
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

  // ===== ФУНКЦИЯ ДЛЯ AI АНАЛИЗА С BASE64 =====
  const analyzeFoodPhotoHandler = async (file) => {
    setIsLoading(true);
    setError(null);
    setAiAnalysisResult(null);
    setScanProgress(10);
    
    try {
      // Конвертируем файл в base64
      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setScanProgress(30);
      console.log('📤 Отправка фото на сервер для AI анализа (base64)...');
      
      // Используем функцию из api.js для отправки base64
      const result = await analyzeFoodPhotoBase64(base64Image);

      setScanProgress(80);
      console.log('✅ Ответ от сервера:', result);

      if (result.success && result.food) {
        const foodData = result.food;
        
        // Форматируем данные для отображения
        const formattedProduct = {
          name: foodData.name || 'Неизвестное блюдо',
          description: foodData.description || '',
          ingredients: foodData.ingredients || [],
          category: foodData.category || 'Не указана',
          servingSize: foodData.servingSize || '100г',
          cookingMethod: foodData.cookingMethod || 'Не указан',
          allergens: foodData.allergens || [],
          nutriments: {
            calories: foodData.nutritionalInfo?.calories || 0,
            protein: foodData.nutritionalInfo?.proteins || 0,
            fat: foodData.nutritionalInfo?.fats || 0,
            carbs: foodData.nutritionalInfo?.carbohydrates || 0,
            fiber: foodData.nutritionalInfo?.fiber || 0,
            sugars: foodData.nutritionalInfo?.sugar || 0,
            salt: foodData.nutritionalInfo?.sodium || 0,
            cholesterol: foodData.nutritionalInfo?.cholesterol || 0
          },
          image: URL.createObjectURL(file),
          type: 'ai-analysis',
          source: 'AI Анализ через OpenRouter',
          timestamp: new Date().toLocaleString(),
          id: foodData.id,
          barcode: null,
          confidence: 0.95
        };
        
        setScannedProduct(formattedProduct);
        setAiAnalysisResult(formattedProduct);
        setScanProgress(100);
      } else {
        throw new Error(result.message || 'Не удалось распознать блюдо');
      }
      
    } catch (err) {
      console.error('❌ Ошибка AI анализа:', err);
      
      let errorMessage = 'Не удалось проанализировать фото. ';
      
      if (err.response) {
        if (err.response.status === 404) {
          errorMessage = 'На фото не найдены блюда или продукты. Попробуйте загрузить другое фото.';
        } else if (err.response.status === 400) {
          errorMessage = err.response.data?.message || 'Неверный формат изображения.';
        } else if (err.response.status === 413) {
          errorMessage = 'Файл слишком большой. Максимальный размер: 10MB';
        } else {
          errorMessage = err.response.data?.message || 'Ошибка сервера. Попробуйте позже.';
        }
      } else if (err.request) {
        errorMessage = 'Нет ответа от сервера. Проверьте подключение к интернету.';
      } else {
        errorMessage = err.message || 'Произошла неизвестная ошибка.';
      }
      
      setError(errorMessage);
      setScanProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFoodPhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Проверяем размер файла (максимум 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Файл слишком большой. Максимальный размер: 10MB');
      return;
    }
    
    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      setError('Пожалуйста, загрузите изображение');
      return;
    }
    
    setSelectedImage(URL.createObjectURL(file));
    setError(null);
    setScannedProduct(null);
    setAiAnalysisResult(null);
    
    await analyzeFoodPhotoHandler(file);
  };

  const clearResults = () => {
    setScannedProduct(null);
    setError(null);
    setSelectedImage(null);
    setAiAnalysisResult(null);
    setManualBarcode('');
    setShowManualInput(false);
    setScanProgress(0);
    setShowIngredients(false);
    setShowAllergens(false);
    setExpandedSections({
      nutrition: true,
      ingredients: false,
      allergens: false,
      details: false
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (barcodeFileInputRef.current) {
      barcodeFileInputRef.current.value = '';
    }
  };

  const addToDiary = async (product) => {
    try {
      if (!product || !product.name) {
        setError('Нет данных о продукте для добавления');
        return;
      }

      const getMealType = () => {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 11) return 'breakfast';
        if (hour >= 11 && hour < 15) return 'lunch';
        if (hour >= 15 && hour < 18) return 'snack';
        if (hour >= 18 && hour < 23) return 'dinner';
        return 'snack';
      };

      const entryData = {
        meal_type: getMealType(),
        eaten_at: new Date().toISOString(),
        product_name: product.name,
        source_type: product.type === 'ai-analysis' ? 'photo' : 'barcode',
        portion_grams: 100,
        calories: product.nutriments?.calories || 0,
        protein: product.nutriments?.protein || 0,
        fat: product.nutriments?.fat || 0,
        carbs: product.nutriments?.carbs || 0,
        barcode_value: product.barcode || null,
        photo_url: product.image || null,
        manual_notes: `Добавлено через ${product.type === 'ai-analysis' ? 'AI анализ' : 'сканер'}. Источник: ${product.source || 'Неизвестен'}`
      };

      setIsLoading(true);
      setError(null);

      // Используем функцию из api.js
      await addFoodEntry(entryData);

      alert(`✅ Продукт "${product.name}" успешно добавлен в дневник питания!`);
      clearResults();
      
    } catch (err) {
      console.error('Ошибка при добавлении в дневник:', err);
      
      let errorMessage = 'Не удалось добавить продукт в дневник. ';
      if (err.response) {
        errorMessage += err.response.data?.message || err.response.statusText || 'Ошибка сервера';
      } else if (err.request) {
        errorMessage += 'Нет ответа от сервера. Проверьте подключение к интернету.';
      } else {
        errorMessage += err.message || 'Неизвестная ошибка';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Вспомогательная функция для отображения типа приёма пищи на русском
  const getMealTypeLabel = (type) => {
    const labels = {
      breakfast: 'Завтрак',
      lunch: 'Обед',
      dinner: 'Ужин',
      snack: 'Перекус'
    };
    return labels[type] || type;
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

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

  // Компонент для отображения детальной информации о продукте
  const ProductDetails = ({ product }) => {
    if (!product) return null;
    
    return (
      <div className="product-details-expanded">
        {product.description && (
          <div className="detail-section">
            <h4><FaInfo /> Описание</h4>
            <p>{product.description}</p>
          </div>
        )}
        
        {product.category && product.category !== 'Не указана' && (
          <div className="detail-section">
            <h4><FaTag /> Категория</h4>
            <span className="category-tag">{product.category}</span>
          </div>
        )}
        
        {product.cookingMethod && product.cookingMethod !== 'Не указан' && (
          <div className="detail-section">
            <h4><FaUtensils /> Способ приготовления</h4>
            <p>{product.cookingMethod}</p>
          </div>
        )}
        
        {product.servingSize && (
          <div className="detail-section">
            <h4><FaWeightHanging /> Размер порции</h4>
            <span className="serving-size">{product.servingSize}</span>
          </div>
        )}
        
        {product.ingredients && product.ingredients.length > 0 && (
          <div className="detail-section">
            <h4 
              className="section-header clickable"
              onClick={() => setExpandedSections(prev => ({ ...prev, ingredients: !prev.ingredients }))}
            >
              <FaListUl /> Ингредиенты
              <span className="toggle-icon">{expandedSections.ingredients ? '▲' : '▼'}</span>
            </h4>
            {expandedSections.ingredients && (
              <div className="ingredients-list">
                {product.ingredients.map((ingredient, index) => (
                  <span key={index} className="ingredient-tag">{ingredient}</span>
                ))}
              </div>
            )}
          </div>
        )}
        
        {product.allergens && product.allergens.length > 0 && (
          <div className="detail-section">
            <h4 
              className="section-header clickable"
              onClick={() => setExpandedSections(prev => ({ ...prev, allergens: !prev.allergens }))}
            >
              <FaExclamationTriangle /> Аллергены
              <span className="toggle-icon">{expandedSections.allergens ? '▲' : '▼'}</span>
            </h4>
            {expandedSections.allergens && (
              <div className="allergens-list">
                {product.allergens.map((allergen, index) => (
                  <span key={index} className="allergen-tag">{allergen}</span>
                ))}
              </div>
            )}
          </div>
        )}
        
        {product.nutriments?.cholesterol > 0 && (
          <div className="detail-section">
            <h4><FaInfo /> Дополнительная информация</h4>
            <div className="extra-info">
              {product.nutriments.cholesterol > 0 && (
                <span>Холестерин: {product.nutriments.cholesterol} мг</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="scanner-wrapper">
      <div className="dashboard-card scanner-card">
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
                ? 'Наведите камеру на штрихкод, используйте зум для лучшего распознавания'
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
                playsInline 
                autoPlay
                muted
                style={{ display: 'none' }}
              />
              <canvas 
                ref={canvasRef} 
                className="scanner-video mirrored"
                style={{ display: scanning ? 'block' : 'none' }}
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
                  <div className="scanning-hint">
                    {isZoomed ? '🔍 Приближено' : 'Наведите на штрихкод'}
                  </div>
                </div>
              )}
            </div>
            
            {scanning && (
              <div className="scanning-controls">
                <button className="control-btn" onClick={toggleZoom}>
                  {isZoomed ? <FaCompress /> : <FaExpand />}
                  {isZoomed ? ' Уменьшить' : ' Приблизить'}
                </button>
                <button className="control-btn" onClick={toggleTorch}>
                  {torchOn ? '🔦 Выкл' : '🔦 Вкл'}
                </button>
                <button className="control-btn" onClick={toggleScanning}>
                  {isScanningPaused ? '▶️' : '⏸️'}
                </button>
                <button className="control-btn" onClick={() => {
                  stopScanner();
                  setShowManualInput(true);
                }}>
                  <FaKeyboard /> Ввести
                </button>
                <button className="control-btn stop" onClick={stopScanner}>
                  <FaStop /> Стоп
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="photo-analysis">
            <FaCamera className="scanner-icon" />
            <h2>AI Анализ блюда</h2>
            <p>Загрузите фотографию блюда для анализа состава и пищевой ценности</p>
            
            <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
              <FaUpload className="upload-icon" />
              <div className="upload-text">
                <strong>Нажмите для загрузки</strong> или перетащите фото сюда
              </div>
              <div className="upload-hint">
                Поддерживаются: JPG, PNG, WebP (макс. 10MB)
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFoodPhotoUpload}
                style={{ display: 'none' }}
                ref={fileInputRef}
              />
            </div>
            
            {selectedImage && scanMethod === 'photo' && !isLoading && (
              <div className="preview-image">
                <img src={selectedImage} alt="Загруженное фото" />
                <button className="remove-image" onClick={() => {
                  setSelectedImage(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}>
                  <FaTimes />
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
          ref={barcodeFileInputRef}
        />

        {isLoading && (
          <div className="loading-container">
            <FaSpinner className="spinner-large" />
            <p> 
              {scanMethod === 'photo' 
                ? '🔄 Анализируем фото через AI...' 
                : '🔍 Ищем информацию о продукте...'}
            </p>
            <ProgressBar />
          </div>
        )}

        {scannedProduct && !isLoading && (
          <div className="scan-result">
            <div className="scan-result-header">
              <FaCheckCircle className="success-icon" />
              <h3>
                {scannedProduct.type === 'ai-analysis' 
                  ? '🍽️ Блюдо успешно распознано!' 
                  : '📦 Продукт найден!'}
              </h3>
              {scannedProduct.type === 'ai-analysis' && (
                <span className="source-badge">
                  <FaCamera /> AI Анализ
                </span>
              )}
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
                {scannedProduct.type === 'ai-analysis' && scannedProduct.confidence && (
                  <p className="confidence"><FaStar /> Точность: {(scannedProduct.confidence * 100).toFixed(0)}%</p>
                )}
                {scannedProduct.nutriscore && (
                  <p className={`nutriscore nutriscore-${scannedProduct.nutriscore}`}>
                    <FaChartLine /> Nutri-Score: {scannedProduct.nutriscore.toUpperCase()}
                  </p>
                )}
                {scannedProduct.timestamp && (
                  <p className="timestamp"><FaClock /> {scannedProduct.timestamp}</p>
                )}
              </div>
            </div>

            {scannedProduct.categories && scannedProduct.categories !== 'Не указаны' && (
              <div className="product-categories">
                <FaClipboardList /> {scannedProduct.categories}
              </div>
            )}
            
            <div className="nutritional-info">
              <div className="nutrient-item calories">
                <span className="nutrient-label"><FaFire /> Калории</span>
                <span className="nutrient-value">
                  {scannedProduct.nutriments?.calories || 0} ккал
                </span>
              </div>
              <div className="nutrient-item protein">
                <span className="nutrient-label"><FaEgg /> Белки</span>
                <span className="nutrient-value">
                  {scannedProduct.nutriments?.protein || 0} г
                </span>
              </div>
              <div className="nutrient-item fat">
                <span className="nutrient-label"><FaCheese /> Жиры</span>
                <span className="nutrient-value">
                  {scannedProduct.nutriments?.fat || 0} г
                </span>
              </div>
              <div className="nutrient-item carbs">
                <span className="nutrient-label"><FaBreadSlice /> Углеводы</span>
                <span className="nutrient-value">
                  {scannedProduct.nutriments?.carbs || 0} г
                </span>
              </div>
            </div>

            {(scannedProduct.nutriments?.fiber > 0 || 
              scannedProduct.nutriments?.sugars > 0 || 
              scannedProduct.nutriments?.salt > 0) && (
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

            {/* Детальная информация для AI анализа */}
            {scannedProduct.type === 'ai-analysis' && (
              <ProductDetails product={scannedProduct} />
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
                {scanMethod === 'photo' && (
                  <button className="retry-btn" onClick={() => fileInputRef.current?.click()}>
                    <FaUpload /> Попробовать другое фото
                  </button>
                )}
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