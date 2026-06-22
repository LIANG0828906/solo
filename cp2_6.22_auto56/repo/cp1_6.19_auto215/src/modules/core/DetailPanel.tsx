import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../../store/useStore';
import type { Item, Message } from '../../types';
import { ChatService } from './ChatService';

interface DetailPanelProps {
  item: Item;
  onBack: () => void;
}

export function DetailPanel({ item, onBack }: DetailPanelProps) {
  const { currentUser, showChatWindow, setShowChatWindow, confirmExchange, messages } = useStore();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showChatWindow) {
      const convId = ChatService.startConversation(item.id);
      setConversationId(convId);
    }
  }, [showChatWindow, item.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, conversationId]);

  const handleSend = () => {
    if (!inputValue.trim() || !conversationId) return;
    ChatService.sendMessage(conversationId, inputValue);
    setInputValue('');
  };

  const handleConfirmExchange = () => {
    confirmExchange(item.id);
    setShowChatWindow(false);
    onBack();
  };

  const handleStartChat = () => {
    setShowChatWindow(true);
  };

  const conversationMessages = conversationId
    ? (messages[conversationId] || []).slice(-50)
    : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        flex: 1,
        display: 'flex',
        maxWidth: 1200,
        margin: '0 auto',
        width: '100%',
        padding: 20,
        paddingBottom: 80,
      }}
    >
      <div style={{ width: '60%', paddingRight: 20 }}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#E0E0E0',
            padding: '8px 16px',
            borderRadius: 8,
            cursor: 'pointer',
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          ← 返回列表
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(8px)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '100%',
              height: 300,
              background: '#f0f0f0',
              overflow: 'hidden',
            }}
          >
            <img
              src={item.imageUrl}
              alt={item.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <div style={{ padding: 20, color: '#E0E0E0' }}>
            <h1 style={{ margin: '0 0 12px', fontSize: 22 }}>{item.name}</h1>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <span
                style={{
                  fontSize: 12,
                  padding: '4px 12px',
                  borderRadius: 12,
                  background: 'rgba(74, 144, 217, 0.2)',
                  color: '#4A90D9',
                }}
              >
                {item.category}
              </span>
              <span
                style={{
                  fontSize: 12,
                  padding: '4px 12px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.1)',
                  color: '#95A5A6',
                }}
              >
                约 {item.weight} kg
              </span>
              <span
                style={{
                  fontSize: 12,
                  padding: '4px 12px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.1)',
                  color: '#95A5A6',
                }}
              >
                {item.distance} km
              </span>
            </div>

            <div style={{ marginBottom: 16, fontSize: 14, color: '#BDC3C7', lineHeight: 1.6 }}>
              {item.description}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 0',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#ddd',
                  marginRight: 12,
                  overflow: 'hidden',
                }}
              >
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.publisherId}`}
                  alt={item.publisherName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{item.publisherName}</div>
                <div style={{ fontSize: 12, color: '#95A5A6' }}>
                  发布于 {new Date(item.publishTime).toLocaleDateString()}
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: '#3A7BC8' }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartChat}
              disabled={item.status !== 'available'}
              style={{
                width: 160,
                height: 40,
                borderRadius: 8,
                background: item.status === 'available' ? '#4A90D9' : '#95A5A6',
                color: '#fff',
                border: 'none',
                fontSize: 14,
                fontWeight: 500,
                cursor: item.status === 'available' ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s ease',
              }}
            >
              {item.status === 'available' ? '联系交换' : '暂不可交换'}
            </motion.button>
          </div>
        </motion.div>
      </div>

      <div style={{ width: '35%' }}>
        <div
          style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(8px)',
            borderRadius: 12,
            padding: 16,
            color: '#E0E0E0',
          }}
        >
          <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>快速聊天</h3>
          <div
            style={{
              height: 300,
              overflowY: 'auto',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
            }}
          >
            {conversationMessages.length === 0 ? (
              <div style={{ color: '#95A5A6', fontSize: 13, textAlign: 'center', padding: 20 }}>
                点击「联系交换」开始对话
              </div>
            ) : (
              conversationMessages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent:
                      msg.senderId === currentUser.id ? 'flex-end' : 'flex-start',
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: '8px 12px',
                      borderRadius: 12,
                      fontSize: 13,
                      background:
                        msg.senderId === currentUser.id ? '#4A90D9' : 'rgba(255,255,255,0.1)',
                      color: '#fff',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="输入消息..."
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#E0E0E0',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              style={{
                padding: '0 16px',
                borderRadius: 8,
                background: '#2ECC71',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              发送
            </motion.button>
          </div>
        </div>

        {item.status === 'available' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConfirmExchange}
            style={{
              width: '100%',
              height: 44,
              marginTop: 12,
              borderRadius: 8,
              background: '#2ECC71',
              color: '#fff',
              border: 'none',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            ✓ 确认交换
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {showChatWindow && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 320,
              height: 400,
              background: 'rgba(26, 38, 52, 0.95)',
              backdropFilter: 'blur(8px)',
              borderRadius: '12px 0 0 12px',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#E0E0E0',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 500 }}>与 {item.publisherName} 聊天</span>
              <button
                onClick={() => setShowChatWindow(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#95A5A6',
                  cursor: 'pointer',
                  fontSize: 18,
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {conversationMessages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent:
                      msg.senderId === currentUser.id ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: '8px 12px',
                      borderRadius: 12,
                      fontSize: 13,
                      background:
                        msg.senderId === currentUser.id ? '#4A90D9' : 'rgba(255,255,255,0.1)',
                      color: '#fff',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="输入消息..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#E0E0E0',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  animate={{
                    boxShadow: [
                      '0 0 0 0 rgba(46, 204, 113, 0.7)',
                      '0 0 0 8px rgba(46, 204, 113, 0)',
                    ],
                  }}
                  transition={{
                    boxShadow: {
                      repeat: Infinity,
                      duration: 1.5,
                    },
                  }}
                  style={{
                    padding: '0 16px',
                    borderRadius: 8,
                    background: '#2ECC71',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  发送
                </motion.button>
              </div>
              {item.status === 'available' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmExchange}
                  style={{
                    width: '100%',
                    height: 36,
                    borderRadius: 8,
                    background: '#2ECC71',
                    color: '#fff',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  ✓ 确认交换
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
