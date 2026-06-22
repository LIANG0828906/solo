import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useStore,
  ChatMessage,
  User,
  generateMessageId,
  MOCK_USERS,
} from '../store';
import { eventBus } from '../eventBus';
import {
  processShapeAdd,
  processShapeMove,
  processShapeDelete,
} from './notificationProcessor';

interface MessageItemProps {
  message: ChatMessage;
  user: User | undefined;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, user }) => {
  if (message.type === 'notification') {
    return (
      <motion.div
        initial={{ x: 30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          backgroundColor: '#ECF0F1',
          borderRadius: 6,
          padding: '8px 12px',
          marginBottom: 8,
          borderLeft: `3px solid ${message.shapeInfo?.color || '#3498DB'}`,
          fontSize: 12,
          color: '#2C3E50',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: user?.avatarColor || '#95A5A6',
              flexShrink: 0,
            }}
          />
          <span style={{ fontWeight: 600, fontSize: 11 }}>{user?.name || '未知用户'}</span>
        </div>
        <div style={{ lineHeight: 1.4 }}>{message.content}</div>
      </motion.div>
    );
  }

  const isCurrentUser = message.userId === 'user-1';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'flex',
        justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
        marginBottom: 10,
      }}
    >
      {!isCurrentUser && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            backgroundColor: user?.avatarColor || '#95A5A6',
            marginRight: 8,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 10,
            fontWeight: 'bold',
          }}
        >
          {user?.name?.charAt(0) || '?'}
        </div>
      )}
      <div
        style={{
          maxWidth: '75%',
          backgroundColor: isCurrentUser ? '#3498DB' : 'white',
          color: isCurrentUser ? 'white' : '#2C3E50',
          padding: '8px 12px',
          borderRadius: isCurrentUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
          fontSize: 13,
          lineHeight: 1.4,
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          wordBreak: 'break-word',
        }}
      >
        {message.content}
      </div>
    </motion.div>
  );
};

interface ChatPanelProps {
  isMobile?: boolean;
  onClose?: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ isMobile = false, onClose }) => {
  const messages = useStore((state) => state.messages);
  const currentUserId = useStore((state) => state.currentUserId);
  const users = useStore((state) => state.users);
  const addMessage = useStore((state) => state.addMessage);

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub1 = eventBus.on('shape:add', (data) => {
      if (data.shape) {
        processShapeAdd(data.shape);
      }
    });

    const unsub2 = eventBus.on('shape:move', (data) => {
      if (data.shape) {
        processShapeMove(data.shape);
      }
    });

    const unsub3 = eventBus.on('shape:delete', (data) => {
      if (data.shape) {
        processShapeDelete(data.shape);
      }
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const message: ChatMessage = {
      id: generateMessageId(),
      type: 'text',
      userId: currentUserId,
      content: inputValue.trim(),
      timestamp: Date.now(),
    };

    addMessage(message);
    setInputValue('');

    simulateBotReply();
  };

  const simulateBotReply = () => {
    const otherUsers = users.filter((u) => u.id !== currentUserId && u.isOnline);
    if (otherUsers.length === 0) return;

    const randomUser = otherUsers[Math.floor(Math.random() * otherUsers.length)];
    const replies = [
      '好主意！',
      '我来补充一下...',
      '这个设计不错👍',
      '我们可以再讨论一下',
      '收到！',
      '明白了',
    ];
    const randomReply = replies[Math.floor(Math.random() * replies.length)];

    setTimeout(() => {
      const message: ChatMessage = {
        id: generateMessageId(),
        type: 'text',
        userId: randomUser.id,
        content: randomReply,
        timestamp: Date.now(),
      };
      addMessage(message);
    }, 800 + Math.random() * 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getUser = (userId: string) => users.find((u) => u.id === userId);

  const panelContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#F8F9FA',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: '#34495E',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 14 }}>讨论与通知</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, opacity: 0.8 }}>
            {users.filter((u) => u.isOnline).length} 人在线
          </span>
          <div style={{ display: 'flex', marginLeft: 4 }}>
            {users
              .filter((u) => u.isOnline)
              .map((user, index) => (
                <div
                  key={user.id}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    backgroundColor: user.avatarColor,
                    border: '2px solid #34495E',
                    marginLeft: index > 0 ? -6 : 0,
                  }}
                  title={user.name}
                />
              ))}
          </div>
        </div>
        {isMobile && onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: 20,
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ×
          </button>
        )}
      </div>

      <div
        ref={messagesEndRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 12,
          maxHeight: isMobile ? 'calc(100vh - 120px)' : 500,
        }}
      >
        <AnimatePresence>
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              user={getUser(message.userId)}
            />
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div
        style={{
          padding: '10px 12px',
          borderTop: '1px solid #E0E0E0',
          backgroundColor: 'white',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            style={{
              flex: 1,
              height: 36,
              borderRadius: 18,
              border: '1px solid #BDC3C7',
              padding: '0 16px',
              fontSize: 13,
              outline: 'none',
              transition: 'border-color 0.2s',
              backgroundColor: '#F8F9FA',
            }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: '#3498DB',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            ➤
          </motion.button>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'tween', duration: 0.3 }}
          style={{
            width: '85%',
            maxWidth: 360,
            height: '100%',
            backgroundColor: '#F8F9FA',
            boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {panelContent}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div
      style={{
        width: 320,
        flexShrink: 0,
        borderLeft: '1px solid #E0E0E0',
        backgroundColor: '#F8F9FA',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {panelContent}
    </div>
  );
};

export default ChatPanel;
