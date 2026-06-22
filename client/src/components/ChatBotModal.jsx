import React, { useState, useRef, useEffect } from 'react';
import { FaTimes, FaRobot, FaPaperPlane, FaSpinner, FaUser } from 'react-icons/fa';
import { sendChatMessage, getChatSuggestions, getCurrentUser } from '../api';

const ChatBotModal = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Привет! Я EcoTrack бот. Задайте вопрос о здоровом образе жизни, питании или фитнесе!',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickSuggestions, setQuickSuggestions] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Получение данных пользователя при открытии
  useEffect(() => {
    if (isOpen) {
      const user = getCurrentUser();
      if (user) {
        setUserInfo(user);
      }
      fetchSuggestions();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSuggestions = async () => {
    try {
      const response = await getChatSuggestions();
      if (response.success) {
        setQuickSuggestions(response.suggestions);
      }
    } catch (error) {
      console.error('Ошибка при получении подсказок:', error);
    }
  };

  const sendMessage = async (text) => {
    const messageText = text || inputText.trim();
    if (!messageText || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const history = messages
        .slice(-5)
        .filter(msg => !msg.isError)
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));

      const response = await sendChatMessage(messageText, history);

      // Обновляем информацию о пользователе из ответа
      if (response.userInfo) {
        setUserInfo(prev => ({
          ...prev,
          ...response.userInfo
        }));
      }

      const botMessage = {
        id: Date.now() + 1,
        text: response.message,
        sender: 'bot',
        timestamp: new Date(),
        metadata: response.metadata
      };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      let errorText = 'Извините, произошла ошибка. Попробуйте позже.';
      
      if (error.response?.data?.message) {
        errorText = error.response.data.message;
      } else if (error.request) {
        errorText = 'Нет ответа от сервера. Проверьте подключение.';
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        text: errorText,
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="chatbot-overlay" onClick={onClose}>
      <div className="chatbot-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <FaRobot className="chatbot-icon" />
            <div>
              <h3>EcoTrack Бот</h3>
              <p>
                {userInfo ? (
                  <>
                    <FaUser style={{ fontSize: '12px', marginRight: '4px' }} />
                    {userInfo.full_name || userInfo.login || 'Пользователь'}
                    {userInfo.role_name && (
                      <span className="user-role"> • {userInfo.role_name}</span>
                    )}
                  </>
                ) : (
                  'ЗОЖ-консультант'
                )}
              </p>
            </div>
          </div>
          <button className="chatbot-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="chatbot-messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${msg.sender === 'user' ? 'user-message' : 'bot-message'}`}
            >
              {msg.sender === 'bot' && (
                <div className="message-avatar">
                  <FaRobot />
                </div>
              )}
              <div className="message-content">
                <p className={msg.isError ? 'error-text' : ''}>{msg.text}</p>
                <span className="message-time">{formatTime(msg.timestamp)}</span>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message bot-message">
              <div className="message-avatar">
                <FaSpinner className="spinner" />
              </div>
              <div className="message-content">
                <p>Думаю...</p>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {messages.length <= 2 && quickSuggestions.length > 0 && (
          <div className="quick-suggestions">
            {quickSuggestions.slice(0, 4).map((suggestion, index) => (
              <button
                key={index}
                className="suggestion-btn"
                onClick={() => sendMessage(suggestion)}
                disabled={isLoading}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <div className="chatbot-input-area">
          <div className="chatbot-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              placeholder="Введите сообщение..."
              className="chatbot-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button
              className="chatbot-send-btn"
              onClick={() => sendMessage()}
              disabled={isLoading || !inputText.trim()}
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBotModal;