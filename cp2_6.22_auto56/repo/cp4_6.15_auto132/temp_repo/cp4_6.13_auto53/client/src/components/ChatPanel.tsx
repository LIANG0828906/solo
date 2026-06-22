import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../store';
import './ChatPanel.css';

interface Props {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isSeller: boolean;
  onlineCount: { visitorCount: number; sellerOnline: boolean };
  hasNewMessage?: boolean;
  onMessageRead?: () => void;
  rateLimit?: number;
  sellerName?: string;
}

function ChatPanel({
  messages,
  onSendMessage,
  isSeller,
  onlineCount,
  hasNewMessage,
  onMessageRead,
  rateLimit = 0,
  sellerName = '卖家',
}: Props) {
  const [inputValue, setInputValue] = useState('');
  const [lastSendTime, setLastSendTime] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSend = () => {
    const content = inputValue.trim();
    if (!content) return;

    const now = Date.now();
    if (rateLimit > 0 && now - lastSendTime < rateLimit * 1000) {
      const remaining = Math.ceil((rateLimit * 1000 - (now - lastSendTime)) / 1000);
      setCountdown(remaining);
      return;
    }

    onSendMessage(content);
    setInputValue('');
    setLastSendTime(now);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="chat-panel" ref={panelRef}>
      <div className="chat-header">
        <div className="chat-title">
          <span className="chat-icon">💬</span>
          <span>实时聊天</span>
          {hasNewMessage && <span className="notification-dot" />}
        </div>
        <div className="online-info">
          <span className={`online-dot ${onlineCount.sellerOnline ? 'online' : ''}`} />
          <span className="online-text">
            卖家{onlineCount.sellerOnline ? '在线' : '离线'}
          </span>
          <span className="visitor-count">👥 {onlineCount.visitorCount}人在看</span>
        </div>
      </div>

      <div className="chat-messages" onClick={onMessageRead}>
        {messages.length === 0 ? (
          <div className="chat-empty">
            <span className="empty-icon">👋</span>
            <p>暂无消息，{isSeller ? '等待访客咨询' : '有问题随时问我哦~'}</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMine = (isSeller && msg.is_seller === 1) || (!isSeller && msg.is_seller === 0);
            return (
              <div
                key={msg.id}
                className={`message-bubble ${isMine ? 'mine' : 'other'}`}
                style={{ animationDelay: `${index * 0.02}s` }}
              >
                {!isMine && (
                  <div className="message-avatar">
                    {msg.is_seller === 1 ? '👨‍💼' : '👤'}
                  </div>
                )}
                <div className="message-content">
                  {!isMine && (
                    <span className="message-sender">{msg.sender_name}</span>
                  )}
                  <div className="message-text">{msg.content}</div>
                  <span className="message-time">{formatTime(msg.created_at)}</span>
                </div>
                {isMine && (
                  <div className="message-avatar">
                    {msg.is_seller === 1 ? '👨‍💼' : '👤'}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        {rateLimit > 0 && countdown > 0 && (
          <div className="rate-limit-tip">
            发送太频繁，请等待 {countdown} 秒
          </div>
        )}
        <div className="chat-input-wrapper">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isSeller ? '输入消息...' : '输入消息，向卖家咨询...'}
            className="chat-input"
          />
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!inputValue.trim() || countdown > 0}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;
