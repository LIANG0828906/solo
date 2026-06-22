import { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import type { Message } from '../types';
import { messageApi } from '../api';

const platformLabels: Record<string, string> = {
  airbnb: 'Airbnb',
  xiaozhu: '小猪',
};

interface MessageCardProps {
  message: Message;
  isExpanded: boolean;
  replyText: string;
  onToggleExpand: (id: string) => void;
  onReplyChange: (text: string) => void;
  onSend: (id: string) => void;
  onKeyDown: (e: React.KeyboardEvent, id: string) => void;
  onCancel: () => void;
  formatTime: (dateStr: string) => string;
}

const MessageCard = memo(function MessageCard({
  message,
  isExpanded,
  replyText,
  onToggleExpand,
  onReplyChange,
  onSend,
  onKeyDown,
  onCancel,
  formatTime,
}: MessageCardProps) {
  return (
    <div
      className={`message-card platform-${message.platform} ${message.isReplied ? 'replied replied-card' : ''} ${isExpanded ? 'expanded' : ''}`}
    >
      <div className="message-header">
        <div className="message-avatar">{message.guestName.charAt(0)}</div>
        <div className="message-info">
          <div className="message-guest">
            {message.guestName}
            <span className="message-platform-tag">{platformLabels[message.platform]}</span>
          </div>
          <div className="message-property">{message.propertyName}</div>
        </div>
      </div>

      <div className="message-content">{message.content}</div>
      <div className="message-time">{formatTime(message.createdAt)}</div>

      {!message.isReplied && (
        <div className="message-actions">
          <button
            className="btn-primary"
            onClick={() => {
              if (isExpanded) {
                onSend(message.id);
              } else {
                onToggleExpand(message.id);
              }
            }}
          >
            {isExpanded ? '发送' : '回复'}
          </button>
          {isExpanded && (
            <button className="btn-secondary" onClick={onCancel}>
              取消
            </button>
          )}
        </div>
      )}

      {isExpanded && !message.isReplied && (
        <div className="reply-container">
          <textarea
            className="reply-input"
            value={replyText}
            onChange={(e) => onReplyChange(e.target.value)}
            onKeyDown={(e) => onKeyDown(e, message.id)}
            placeholder="输入回复内容，按 Enter 发送..."
            autoFocus
          />
          <div className="reply-hint">按 Enter 发送，Shift + Enter 换行</div>
        </div>
      )}

      {message.isReplied && message.reply && (
        <div className="reply-content">
          <div className="reply-label">我的回复</div>
          <div className="reply-text">{message.reply}</div>
        </div>
      )}
    </div>
  );
});

export default function MessagePanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState<'all' | 'unreplied' | 'replied'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchStartTime = useRef<number>(0);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = useCallback(async (search?: string) => {
    setLoading(true);
    if (search) {
      searchStartTime.current = performance.now();
    }
    try {
      const params: { isReplied?: boolean; search?: string } = {};
      if (filter === 'unreplied') params.isReplied = false;
      else if (filter === 'replied') params.isReplied = true;
      if (search) params.search = search;

      const data = await messageApi.getAll(params);
      setMessages(data);

      if (search && searchStartTime.current > 0) {
        const totalTime = performance.now() - searchStartTime.current;
        console.log(`Message search completed in ${totalTime.toFixed(0)}ms`);
        searchStartTime.current = 0;
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      fetchMessages(searchText);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchText, filter, fetchMessages]);

  const { unrepliedMessages, repliedMessages } = useMemo(() => {
    const unreplied: Message[] = [];
    const replied: Message[] = [];
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.isReplied) {
        replied.push(msg);
      } else {
        unreplied.push(msg);
      }
    }
    return { unrepliedMessages: unreplied, repliedMessages: replied };
  }, [messages]);

  const handleReply = useCallback(
    async (id: string) => {
      if (!replyText.trim()) return;

      try {
        const updated = await messageApi.reply(id, replyText.trim());
        setMessages((prev) => prev.map((m) => (m.id === id ? updated : m)));
        setReplyText('');
        setExpandedId(null);
      } catch (error) {
        console.error('Failed to reply:', error);
      }
    },
    [replyText]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, id: string) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleReply(id);
      }
    },
    [handleReply]
  );

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedId(id);
    setReplyText('');
  }, []);

  const handleCancel = useCallback(() => {
    setExpandedId(null);
    setReplyText('');
  }, []);

  const handleReplyChange = useCallback((text: string) => {
    setReplyText(text);
  }, []);

  const formatTime = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  }, []);

  const renderMessageCard = useCallback(
    (msg: Message) => (
      <MessageCard
        key={msg.id}
        message={msg}
        isExpanded={expandedId === msg.id}
        replyText={replyText}
        onToggleExpand={handleToggleExpand}
        onReplyChange={handleReplyChange}
        onSend={handleReply}
        onKeyDown={handleKeyDown}
        onCancel={handleCancel}
        formatTime={formatTime}
      />
    ),
    [expandedId, replyText, handleToggleExpand, handleReplyChange, handleReply, handleKeyDown, handleCancel, formatTime]
  );

  if (loading) {
    return (
      <div className="page-transition">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  const showUnreplied = filter === 'all' || filter === 'unreplied';
  const showReplied = filter === 'all' || filter === 'replied';

  return (
    <div className="page-transition">
      <div className="page-header">
        <h1 className="page-title">消息面板</h1>
        <span className="unread-badge">
          {unrepliedMessages.length} 条待回复
        </span>
      </div>

      <div className="message-toolbar">
        <input
          type="text"
          className="search-input"
          placeholder="搜索客人姓名、房源或消息内容..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            全部
          </button>
          <button
            className={`filter-tab ${filter === 'unreplied' ? 'active' : ''}`}
            onClick={() => setFilter('unreplied')}
          >
            未回复
          </button>
          <button
            className={`filter-tab ${filter === 'replied' ? 'active' : ''}`}
            onClick={() => setFilter('replied')}
          >
            已回复
          </button>
        </div>
      </div>

      {showUnreplied && (
        <div className="message-section">
          <h2 className="message-section-title">
            待回复
            <span className="message-count">{unrepliedMessages.length}</span>
          </h2>
          {unrepliedMessages.length > 0 ? (
            <div className="message-list">{unrepliedMessages.map(renderMessageCard)}</div>
          ) : (
            <div className="empty-section">
              <span>暂无待回复消息</span>
            </div>
          )}
        </div>
      )}

      {showReplied && (
        <div className="message-section">
          <h2 className="message-section-title">
            已回复
            <span className="message-count replied">{repliedMessages.length}</span>
          </h2>
          {repliedMessages.length > 0 ? (
            <div className="message-list">{repliedMessages.map(renderMessageCard)}</div>
          ) : (
            <div className="empty-section">
              <span>暂无已回复消息</span>
            </div>
          )}
        </div>
      )}

      {messages.length === 0 && (
        <div className="empty-state card">
          <div className="empty-icon">📭</div>
          <div className="empty-text">
            {searchText ? '没有找到匹配的消息' : '暂无消息'}
          </div>
        </div>
      )}
    </div>
  );
}
