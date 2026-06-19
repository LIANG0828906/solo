import React, { useState, useRef, useEffect } from 'react';
import { User, ChatMessage } from '../types';
import { useStore } from '../store/useStore';

interface ChatWindowProps {
  chatId: string;
  otherUser: User;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, otherUser }) => {
  const { currentUser, chatMessages, sendMessage, markMessageAsRead } = useStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messages: ChatMessage[] = chatMessages[chatId] || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    const unreadFromOther = messages.filter(
      (m) => m.sender_id === otherUser.id && !m.is_read
    );
    if (unreadFromOther.length > 0) {
      const timer = setTimeout(() => {
        unreadFromOther.forEach((m) => markMessageAsRead(m.id));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [messages.length, otherUser.id, markMessageAsRead]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    sendMessage(chatId, currentUser!.id, otherUser.id, trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const AVATAR_COLORS = ['#27AE60', '#2980B9', '#E67E22', '#8E44AD'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FFF3E0' }}>
      <div
        style={{
          padding: '12px 16px',
          background: 'rgba(255,243,224,0.95)',
          borderBottom: '1px solid #E0C9A6',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: otherUser.avatar_color || AVATAR_COLORS[0],
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1rem',
          }}
        >
          {otherUser.nickname.charAt(0)}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#3E2723' }}>{otherUser.nickname}</div>
          <div style={{ fontSize: '0.7rem', color: '#999' }}>交换{otherUser.exchange_count}次</div>
        </div>
        {(otherUser.trust_count ?? 0) > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: '1.1rem' }}>🛡️</span>
        )}
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {messages
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .map((msg) => {
            const isSent = msg.sender_id === currentUser?.id;
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isSent ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '75%',
                    padding: '8px 14px',
                    borderRadius: isSent ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isSent ? '#F39C12' : '#fff',
                    color: isSent ? '#fff' : '#3E2723',
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.content}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    marginTop: 2,
                    fontSize: '0.65rem',
                    color: '#aaa',
                  }}
                >
                  <span>{formatTime(msg.created_at)}</span>
                  {isSent && (
                    <span style={{ color: msg.is_read ? '#3498DB' : '#bbb', fontWeight: 600 }}>
                      {msg.is_read ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        <div ref={messagesEndRef} />
      </div>

      <div
        style={{
          padding: '10px 12px',
          background: 'rgba(255,243,224,0.95)',
          borderTop: '1px solid #E0C9A6',
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息..."
          style={{
            flex: 1,
            border: '1px solid #E0C9A6',
            borderRadius: 20,
            padding: '8px 16px',
            fontSize: '0.9rem',
            outline: 'none',
            background: '#fff',
            color: '#3E2723',
          }}
        />
        <button
          onClick={handleSend}
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            border: 'none',
            background: input.trim() ? '#F39C12' : '#E0C9A6',
            color: '#fff',
            fontSize: '1.1rem',
            cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
