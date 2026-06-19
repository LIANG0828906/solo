import React, { useState, useRef, useEffect, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Message, User } from '../utils/types';

interface ChatPanelProps {
  messages: Message[];
  users: User[];
  currentUserId: string | null;
  onSendMessage: (content: string, highlightId?: string, paragraphIndex?: number) => void;
}

const MAX_CHARS = 200;

const DoubleCheckIcon: React.FC<{ isRead: boolean }> = ({ isRead }) => (
  <svg
    className={`double-check ${isRead ? 'double-check-read' : ''}`}
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="currentColor"
  >
    <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" />
  </svg>
);

const ReplyIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
  </svg>
);

const SearchIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
  </svg>
);

const CloseIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
);

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  users,
  currentUserId,
  onSendMessage,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!showSearch) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showSearch]);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const displayMessages = useMemo(() => {
    if (!showSearch || !searchQuery.trim()) {
      return messages;
    }
    const query = searchQuery.trim().toLowerCase();
    return messages
      .filter((m) => m.content.toLowerCase().includes(query))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [messages, showSearch, searchQuery]);

  const isOverLimit = inputValue.length > MAX_CHARS;

  const handleSend = () => {
    const content = inputValue.trim();
    if (!content || isOverLimit) return;
    onSendMessage(content);
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickReply = (msg: Message) => {
    const prefix = `@${msg.userName} `;
    setInputValue(prefix);
    inputRef.current?.focus();
    const endPos = prefix.length;
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(endPos, endPos);
      }
    }, 0);
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

  const getMessageStatus = (msg: Message): 'none' | 'delivered' | 'read' => {
    if (msg.userId !== currentUserId) return 'none';
    const readByOthers = (msg.readBy || []).filter((uid) => uid !== currentUserId);
    if (readByOthers.length > 0) return 'read';
    const receivedByOthers = (msg.receivedBy || []).filter((uid) => uid !== currentUserId);
    if (receivedByOthers.length > 0) return 'delivered';
    return 'none';
  };

  const highlightSearchText = (text: string) => {
    if (!showSearch || !searchQuery.trim()) {
      return text;
    }
    const query = searchQuery.trim();
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="search-highlight">{text.slice(idx, idx + query.length)}</mark>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-header-top">
          <h3>实时讨论</h3>
          <button
            className={`chat-icon-btn ${showSearch ? 'chat-icon-btn-active' : ''}`}
            onClick={() => {
              setShowSearch((s) => !s);
              if (showSearch) setSearchQuery('');
            }}
            title="搜索消息"
          >
            <SearchIcon />
          </button>
        </div>
        {showSearch && (
          <div className="chat-search-box">
            <span className="chat-search-icon"><SearchIcon /></span>
            <input
              ref={searchInputRef}
              type="text"
              className="chat-search-input"
              placeholder="搜索消息内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="chat-search-clear"
                onClick={() => setSearchQuery('')}
                title="清除"
              >
                <CloseIcon />
              </button>
            )}
          </div>
        )}
        {showSearch && searchQuery.trim() && (
          <div className="chat-search-info">
            找到 {displayMessages.length} 条相关消息（按时间倒序）
          </div>
        )}
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
        {displayMessages.length === 0 ? (
          <div className="chat-empty">
            {showSearch && searchQuery.trim() ? '没有匹配的消息' : '暂无消息，发送第一条消息吧'}
          </div>
        ) : (
          displayMessages.map((msg) => {
            const isSelf = msg.userId === currentUserId;
            const status = getMessageStatus(msg);
            const isHovered = hoveredMessageId === msg.id;
            return (
              <div
                key={msg.id}
                className={`chat-message ${isSelf ? 'chat-message-self' : ''} ${
                  showSearch && searchQuery.trim() ? 'chat-message-search' : ''
                }`}
                onMouseEnter={() => setHoveredMessageId(msg.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
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
                  <div className="chat-bubble-wrapper">
                    {!isSelf && isHovered && (
                      <button
                        className="chat-quick-reply-btn"
                        onClick={() => handleQuickReply(msg)}
                        title="回复"
                      >
                        <ReplyIcon />
                      </button>
                    )}
                    <div className={`chat-bubble ${isSelf ? 'chat-bubble-self' : ''}`}>
                      {highlightSearchText(msg.content)}
                      {isSelf && status !== 'none' && (
                        <DoubleCheckIcon isRead={status === 'read'} />
                      )}
                    </div>
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
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className={`chat-input ${isOverLimit ? 'chat-input-overflow' : ''}`}
            placeholder="输入消息，Enter发送 / Ctrl+Enter发送..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <span className={`chat-char-count ${isOverLimit ? 'chat-char-count-overflow' : ''}`}>
            {inputValue.length}/{MAX_CHARS}
          </span>
        </div>
        <button
          className="btn btn-send"
          onClick={handleSend}
          disabled={!inputValue.trim() || isOverLimit}
        >
          发送
        </button>
      </div>
    </div>
  );
};
