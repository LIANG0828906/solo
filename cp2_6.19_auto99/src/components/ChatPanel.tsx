import React, { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Message, User } from '../utils/types';

interface ChatPanelProps {
  messages: Message[];
  users: User[];
  currentUserId: string | null;
  onSendMessage: (content: string, highlightId?: string, paragraphIndex?: number) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  users,
  currentUserId,
  onSendMessage,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const content = inputValue.trim();
    if (!content) return;
    onSendMessage(content);
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getInitials = (name: string) => {
    return name.slice(0, 1).toUpperCase();
  };

  const formatTime = (timestamp: number) => {
    try {
      return formatDistanceToNow(timestamp, { addSuffix: false, locale: zhCN });
    } catch {
      return '刚刚';
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3>实时讨论</h3>
        <div className="chat-users">
          {users.slice(0, 5).map((user) => (
            <div
              key={user.id}
              className="chat-avatar chat-avatar-small"
              style={{ backgroundColor: user.color }}
              title={user.name}
            >
              {getInitials(user.name)}
            </div>
          ))}
          {users.length > 5 && (
            <div className="chat-avatar chat-avatar-small chat-avatar-more">
              +{users.length - 5}
            </div>
          )}
          <span className="chat-user-count">{users.length} 人在线</span>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => {
          const isSelf = msg.userId === currentUserId;
          return (
            <div
              key={msg.id}
              className={`chat-message ${isSelf ? 'chat-message-self' : ''}`}
            >
              {!isSelf && (
                <div
                  className="chat-avatar"
                  style={{ backgroundColor: msg.userColor }}
                >
                  {getInitials(msg.userName)}
                </div>
              )}
              <div className="chat-message-content">
                {!isSelf && (
                  <div className="chat-message-meta">
                    <span className="chat-message-name">{msg.userName}</span>
                    <span className="chat-message-time">{formatTime(msg.createdAt)}</span>
                  </div>
                )}
                {isSelf && (
                  <div className="chat-message-meta chat-message-meta-self">
                    <span className="chat-message-time">{formatTime(msg.createdAt)}</span>
                  </div>
                )}
                <div className={`chat-bubble ${isSelf ? 'chat-bubble-self' : ''}`}>
                  {msg.content}
                </div>
              </div>
              {isSelf && (
                <div
                  className="chat-avatar"
                  style={{ backgroundColor: msg.userColor }}
                >
                  {getInitials(msg.userName)}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <input
          ref={inputRef}
          type="text"
          className="chat-input"
          placeholder="输入消息，按回车发送..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="btn btn-send" onClick={handleSend} disabled={!inputValue.trim()}>
          发送
        </button>
      </div>
    </div>
  );
};
