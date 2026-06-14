import { useState, useEffect, useMemo, useRef } from 'react';
import type { Message } from '../types';
import { messageApi } from '../api';

const platformLabels: Record<string, string> = {
  airbnb: 'Airbnb',
  xiaozhu: '小猪',
};

export default function MessagePanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState<'all' | 'unreplied' | 'replied'>('unreplied');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async (search?: string) => {
    setLoading(true);
    const startTime = performance.now();
    try {
      const params: { isReplied?: boolean; search?: string } = {};
      if (filter === 'unreplied') params.isReplied = false;
      else if (filter === 'replied') params.isReplied = true;
      if (search) params.search = search;
      
      const data = await messageApi.getAll(params);
      setMessages(data);
      
      const totalTime = performance.now() - startTime;
      console.log(`Message search completed in ${totalTime.toFixed(0)}ms`);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

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
  }, [searchText, filter]);

  const { unrepliedMessages, repliedMessages } = useMemo(() => {
    const unreplied = messages.filter(m => !m.isReplied);
    const replied = messages.filter(m => m.isReplied);
    return { unrepliedMessages: unreplied, repliedMessages: replied };
  }, [messages]);

  const handleReply = async (id: string) => {
    if (!replyText.trim()) return;
    
    try {
      const updated = await messageApi.reply(id, replyText.trim());
      setMessages(prev => prev.map(m => m.id === id ? updated : m));
      setReplyText('');
      setExpandedId(null);
    } catch (error) {
      console.error('Failed to reply:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleReply(id);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const renderMessageCard = (msg: Message) => {
    const isExpanded = expandedId === msg.id;
    
    return (
      <div
        key={msg.id}
        className={`message-card platform-${msg.platform} ${msg.isReplied ? 'replied' : ''} ${isExpanded ? 'expanded' : ''}`}
      >
        <div className="message-header">
          <div className="message-avatar">
            {msg.guestName.charAt(0)}
          </div>
          <div className="message-info">
            <div className="message-guest">
              {msg.guestName}
              <span style={{ marginLeft: 8, fontSize: 11, color: '#94a3b8' }}>
                {platformLabels[msg.platform]}
              </span>
            </div>
            <div className="message-property">{msg.propertyName}</div>
          </div>
        </div>
        
        <div className="message-content">{msg.content}</div>
        <div className="message-time">{formatTime(msg.createdAt)}</div>
        
        {!msg.isReplied && (
          <div className="message-actions">
            <button
              className="btn-primary"
              onClick={() => {
                if (isExpanded) {
                  handleReply(msg.id);
                } else {
                  setExpandedId(msg.id);
                  setReplyText('');
                }
              }}
            >
              {isExpanded ? '发送' : '回复'}
            </button>
            {isExpanded && (
              <button
                className="btn-secondary"
                onClick={() => {
                  setExpandedId(null);
                  setReplyText('');
                }}
              >
                取消
              </button>
            )}
          </div>
        )}

        {isExpanded && (
          <div className="reply-container">
            <textarea
              className="reply-input"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, msg.id)}
              placeholder="输入回复内容，按 Enter 发送..."
              autoFocus
            />
            <div className="reply-hint">按 Enter 发送，Shift + Enter 换行</div>
          </div>
        )}

        {msg.isReplied && msg.reply && (
          <div className="reply-content">
            <div className="reply-label">我的回复</div>
            <div className="reply-text">{msg.reply}</div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="page-transition">
      <div className="page-header">
        <h1 className="page-title">消息面板</h1>
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

      {(filter === 'all' || filter === 'unreplied') && unrepliedMessages.length > 0 && (
        <div className="message-section">
          <h2 className="message-section-title">
            待回复
            <span className="message-count">{unrepliedMessages.length}</span>
          </h2>
          <div className="message-list">
            {unrepliedMessages.map(renderMessageCard)}
          </div>
        </div>
      )}

      {(filter === 'all' || filter === 'replied') && repliedMessages.length > 0 && (
        <div className="message-section">
          <h2 className="message-section-title">
            已回复
            <span className="message-count">{repliedMessages.length}</span>
          </h2>
          <div className="message-list">
            {repliedMessages.map(renderMessageCard)}
          </div>
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
