import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Item, Message } from '../data';

interface ChatPanelProps {
  isOpen: boolean;
  item: Item | null;
  onClose: () => void;
  onExchangeComplete: (itemAName: string, itemBName: string) => void;
}

const autoReplies = [
  '好的，我们交换吧！',
  '我再考虑一下',
  '这个可以有，你有什么想换的？',
  '东西还在吗？我很感兴趣',
  '可以约个时间线下交换吗？',
  '好呀，我觉得挺合适的！'
];

const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, item, onClose, onExchangeComplete }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && item) {
      const initialMsg: Message = {
        id: 'welcome',
        sender: item.ownerName,
        content: `你好，对「${item.name}」感兴趣吗？`,
        timestamp: new Date(),
        isSelf: false
      };
      setMessages([initialMsg]);
    }
  }, [isOpen, item]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim() || !item) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: '我',
      content: inputValue.trim(),
      timestamp: new Date(),
      isSelf: true
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');

    setTimeout(() => {
      const reply = autoReplies[Math.floor(Math.random() * autoReplies.length)];
      const autoMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: item.ownerName,
        content: reply,
        timestamp: new Date(),
        isSelf: false
      };
      setMessages((prev) => [...prev, autoMsg]);

      if (reply === '好的，我们交换吧！' || reply === '好呀，我觉得挺合适的！') {
        setTimeout(() => {
          onExchangeComplete('我的物品', item.name);
        }, 800);
      }
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!item) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 200
            }}
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 400,
              maxWidth: '90vw',
              height: 500,
              maxHeight: '90vh',
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              zIndex: 201,
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid #F0F0F0',
              gap: 12
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: item.ownerAvatar,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFF',
                fontWeight: 600,
                fontSize: 16,
                flexShrink: 0
              }}>
                {item.ownerName.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{item.ownerName}</div>
                <div style={{ fontSize: 12, color: '#999' }}>想交换: {item.name}</div>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#F5F5F5',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  color: '#999',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EBEBEB'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F5F5F5'}
              >
                ×
              </button>
            </div>

            <div style={{
              flex: 1,
              height: 350,
              overflowY: 'auto',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              backgroundColor: '#FAFAFA'
            }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: msg.isSelf ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    maxWidth: '70%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    fontSize: 14,
                    lineHeight: 1.5,
                    backgroundColor: msg.isSelf ? '#6C63FF' : '#F0F0F0',
                    color: msg.isSelf ? '#FFF' : '#333',
                    wordBreak: 'break-word'
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              borderTop: '1px solid #F0F0F0',
              gap: 10,
              backgroundColor: '#FFF'
            }}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="输入消息..."
                style={{
                  flex: 1,
                  width: '85%',
                  height: 36,
                  padding: '0 16px',
                  borderRadius: 18,
                  border: isFocused ? '1px solid #6C63FF' : '1px solid #E0E0E0',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.3s',
                  boxSizing: 'border-box'
                }}
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleSend}
                disabled={!inputValue.trim()}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: 'none',
                  background: inputValue.trim()
                    ? 'linear-gradient(135deg, #6C63FF, #FF6584)'
                    : '#E0E0E0',
                  color: '#FFF',
                  cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  flexShrink: 0
                }}
              >
                ➤
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChatPanel;
