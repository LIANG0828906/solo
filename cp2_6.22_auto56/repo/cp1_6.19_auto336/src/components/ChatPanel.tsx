import { useState, useRef, useEffect } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import type { ChatMessage } from '../types';
import './ChatPanel.css';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
}

export default function ChatPanel({ messages, onSendMessage }: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = useOrderStore((state) => state.user);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-panel glass-card">
      <div className="chat-header">
        <h3>💬 实时聊天</h3>
        <span className="chat-member-count">{messages.length} 条消息</span>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>还没有消息</p>
            <p className="empty-hint">快来说第一句话吧~</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`message-item ${msg.userId === user.id ? 'self' : ''} ${msg.type === 'system' ? 'system' : ''}`}
            >
              {msg.type !== 'system' && (
                <img
                  src={msg.userAvatar}
                  alt={msg.userName}
                  className="message-avatar"
                />
              )}
              <div className="message-content-wrapper">
                {msg.type !== 'system' && (
                  <span className="message-sender">{msg.userName}</span>
                )}
                <div className={`message-bubble ${msg.type === 'system' ? 'system-bubble' : ''}`}>
                  {msg.content}
                </div>
                <span className="message-time">{formatTime(msg.timestamp)}</span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入消息..."
          className="chat-input"
        />
        <button onClick={handleSend} className="send-button">
          发送
        </button>
      </div>
    </div>
  );
}
