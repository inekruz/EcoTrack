import React, { useState } from 'react';
import { FaComments, FaTimes } from 'react-icons/fa';
import ChatBotModal from './ChatBotModal';

const ChatBotButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleModal = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button 
        className={`chatbot-float-btn ${isOpen ? 'active' : ''}`}
        onClick={toggleModal}
        aria-label="Открыть чат-бота"
      >
        {isOpen ? <FaTimes /> : <FaComments />}
        {!isOpen && <span className="notification-dot"></span>}
      </button>
      <ChatBotModal isOpen={isOpen} onClose={toggleModal} />
    </>
  );
};

export default ChatBotButton;