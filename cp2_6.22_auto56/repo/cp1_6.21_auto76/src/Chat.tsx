import React, { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
  avatarColor: string;
}

interface ChatProps {
  userId: string;
  userName: string;
  role: 'teacher' | 'student';
  muted: boolean;
  onSendMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp' | 'avatarColor'>) => void;
  messages: ChatMessage[];
}

const EMOJIS = ['😊', '😢', '👍', '👎', '❤️', '🎉', '🔥', '💡', '✅', '❌'];
const AVATAR_COLORS = [
  '#E74C3C', '#3498DB', '#2ECC71', '#F39C12',
  '#9B59B6', '#1ABC9C', '#E67E22', '#34495E',
];

export default function Chat({ userId, userName, role, muted, onSendMessage, messages }: ChatProps) {
  const [input, setInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || muted) return;
    onSendMessage({ userId, userName, content: input.trim() });
    setInput('');
  };

  const handleEmojiClick = (emoji: string) => {
    if (muted) return;
    onSendMessage({ userId, userName, content: emoji });
    setShowEmoji(false);
  };

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              animation: 'msgIn 0.2s ease',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: msg.avatarColor,
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 'bold',
                flexShrink: 0,
              }}
            >
              {getInitial(msg.userName)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>
                {msg.userName}
                <span style={{ marginLeft: 8, fontSize: 10, color: '#AAA' }}>
                  {new Date(msg.timestamp).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: '#333',
                  wordBreak: 'break-word',
                  background: msg.userId === userId ? '#EBF5FB' : '#FFFFFF',
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: '1px solid #EEE',
                  display: 'inline-block',
                  maxWidth: '100%',
                }}
              >
                {msg.content}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showEmoji && (
        <div
          style={{
            padding: 8,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            borderTop: '1px solid #DEE2E6',
            background: '#FFFFFF',
          }}
        >
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              style={{
                width: 36,
                height: 36,
                border: 'none',
                background: '#F5F5F5',
                borderRadius: 6,
                fontSize: 20,
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.2)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <div
        style={{
          padding: 8,
          borderTop: '1px solid #DEE2E6',
          display: 'flex',
          gap: 6,
          background: '#FFFFFF',
        }}
      >
        <button
          onClick={() => setShowEmoji(!showEmoji)}
          style={{
            width: 36,
            height: 36,
            border: '1px solid #DEE2E6',
            background: '#FFFFFF',
            borderRadius: 6,
            fontSize: 18,
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
          }}
        >
          😊
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder={muted ? '全员禁言中...' : '输入消息...'}
          disabled={muted}
          style={{
            flex: 1,
            padding: '6px 12px',
            border: `1px solid ${muted ? '#B0B0B0' : '#DEE2E6'}`,
            borderRadius: 6,
            fontSize: 14,
            outline: 'none',
            background: muted ? '#F0F0F0' : '#FFFFFF',
            color: muted ? '#B0B0B0' : '#333',
          }}
        />
        <button
          onClick={handleSend}
          disabled={muted || !input.trim()}
          style={{
            padding: '6px 16px',
            border: 'none',
            borderRadius: 6,
            background: muted || !input.trim() ? '#CCCCCC' : '#3498DB',
            color: '#FFFFFF',
            fontSize: 14,
            cursor: muted || !input.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!muted && input.trim())
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
          }}
        >
          发送
        </button>
      </div>

      <style>{`
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export type { ChatMessage };
export { AVATAR_COLORS, EMOJIS };
