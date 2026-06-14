import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Users,
  Clock,
  DollarSign,
  MessageCircle,
  Send,
  Utensils,
  Leaf,
} from 'lucide-react';
import type { TableRequest, User, ChatMessage, Participant } from '@/types';
import { formatDateTime, formatMessageTime } from '@/data';

interface TableDetailProps {
  table: TableRequest;
  messages: ChatMessage[];
  currentUser: User;
  onBack: () => void;
  onJoin: (participant: Participant) => void;
  onSendMessage: (content: string) => void;
}

const TableDetail: React.FC<TableDetailProps> = ({
  table,
  messages,
  currentUser,
  onBack,
  onJoin,
  onSendMessage,
}) => {
  const [joinType, setJoinType] = useState<'dish' | 'share' | null>(null);
  const [dishName, setDishName] = useState('');
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const hasJoined = table.participants.some((p) => p.userId === currentUser.id);
  const isFull = table.status === 'full';

  const scrollToBottom = useCallback(() => {
    const container = chatContainerRef.current;
    if (container) {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  const handleJoin = () => {
    if (!joinType || hasJoined || isFull) return;
    if (joinType === 'dish' && !dishName.trim()) return;
    const participant: Participant = {
      userId: currentUser.id,
      user: currentUser,
      joinType,
      bringDish: joinType === 'dish' ? dishName.trim() : undefined,
      joinedAt: new Date(),
    };
    onJoin(participant);
    setJoinType(null);
    setDishName('');
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const dishes: string[] = table.participants
    .filter((p) => p.bringDish)
    .map((p) => p.bringDish as string);

  return (
    <div className="detail-container">
      <button className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} strokeWidth={2} />
        返回大厅
      </button>

      <div className="detail-hero">
        <div className="detail-image-wrap">
          <img src={table.foodImage} alt="" className="detail-image" />
        </div>
        <div className="detail-content">
          <div>
            <div className="detail-title-row">
              <h2 className="detail-title">{table.host.nickname}的拼桌邀请</h2>
              <span className={`detail-status status-${isFull ? 'full' : 'open'}`}>
                {isFull ? '已满员' : '招募中'}
              </span>
            </div>
            <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
              {table.host.community} · 发起人 {table.host.avatar} {table.host.nickname}
            </div>

            <div className="detail-meta">
              <div className="meta-item">
                <div className="meta-label">
                  <Clock size={12} style={{ display: 'inline', marginRight: 4 }} strokeWidth={2} />
                  聚餐时间
                </div>
                <div className="meta-value">{formatDateTime(table.time)}</div>
              </div>
              <div className="meta-item">
                <div className="meta-label">
                  <Users size={12} style={{ display: 'inline', marginRight: 4 }} strokeWidth={2} />
                  已报名
                </div>
                <div className="meta-value coral">
                  {table.participants.length} / {table.maxPeople}人
                </div>
              </div>
              <div className="meta-item">
                <div className="meta-label">
                  <DollarSign size={12} style={{ display: 'inline', marginRight: 4 }} strokeWidth={2} />
                  人均约
                </div>
                <div className="meta-value">¥{table.costPerPerson}</div>
              </div>
            </div>

            <div className="detail-invitation">{table.invitationText}</div>
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-section">
          <div className="section-header">
            <h3 className="section-title">
              <Users className="section-title-icon" strokeWidth={2} />
              参与者 ({table.participants.length}/{table.maxPeople})
            </h3>
          </div>

          <div className="participants-list">
            {table.participants.map((p, idx) => (
              <div key={p.userId} className="participant-card" style={{ animationDelay: `${idx * 40}ms` }}>
                <div
                  className="participant-avatar"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}
                >
                  {p.user.avatar}
                </div>
                <div className="participant-info">
                  <div className="participant-name-row">
                    <span className="participant-name">{p.user.nickname}</span>
                    {p.userId === table.hostId && <span className="host-badge">发起</span>}
                  </div>
                  {p.bringDish ? (
                    <div className="participant-dish">
                      <Utensils size={11} style={{ display: 'inline', marginRight: 3 }} strokeWidth={2} />
                      带 {p.bringDish}
                    </div>
                  ) : (
                    <div className="participant-dish-share">
                      <Leaf size={11} style={{ display: 'inline', marginRight: 3 }} strokeWidth={2} />
                      参与均摊
                    </div>
                  )}
                  <div className="participant-bio">{p.user.bio}</div>
                </div>
              </div>
            ))}
          </div>

          {dishes.length > 0 && (
            <div className="dishes-summary">
              <div className="dishes-title">🍽️ 已确定菜品</div>
              <div className="dishes-tags">
                {dishes.map((d, i) => (
                  <span key={i} className="dish-tag">{d}</span>
                ))}
              </div>
            </div>
          )}

          {!hasJoined && !isFull && (
            <div className="join-section">
              <div className="join-options">
                <div
                  className={`join-option ${joinType === 'dish' ? 'selected' : ''}`}
                  onClick={() => setJoinType('dish')}
                >
                  <div className="join-option-icon">🥘</div>
                  <div className="join-option-title">带一道菜</div>
                  <div className="join-option-desc">分享你的拿手菜</div>
                </div>
                <div
                  className={`join-option ${joinType === 'share' ? 'selected' : ''}`}
                  onClick={() => setJoinType('share')}
                >
                  <div className="join-option-icon">💰</div>
                  <div className="join-option-title">直接均摊</div>
                  <div className="join-option-desc">省心参与费用AA</div>
                </div>
              </div>

              {joinType === 'dish' && (
                <div className="dish-input-wrap">
                  <input
                    type="text"
                    className="dish-input"
                    placeholder="你打算带什么菜？比如：红烧排骨"
                    value={dishName}
                    onChange={(e) => setDishName(e.target.value)}
                    maxLength={30}
                  />
                </div>
              )}

              <button
                className="btn btn-primary btn-lg btn-block"
                onClick={handleJoin}
                disabled={!joinType || (joinType === 'dish' && !dishName.trim())}
              >
                加入这桌拼饭
              </button>
            </div>
          )}

          {hasJoined && (
            <div className="join-section">
              <div
                style={{
                  textAlign: 'center',
                  padding: '8px 0',
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--green)',
                }}
              >
                ✓ 你已加入这桌拼饭
              </div>
            </div>
          )}
        </div>

        <div className="detail-section">
          <div className="section-header">
            <h3 className="section-title">
              <MessageCircle className="section-title-icon" strokeWidth={2} />
              拼桌讨论
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{messages.length} 条消息</span>
          </div>

          <div className="chat-section">
            <div className="chat-messages" ref={chatContainerRef}>
              {messages.length === 0 && (
                <div className="empty-state">
                  <span className="empty-emoji">💬</span>
                  <div className="empty-text">还没有消息，先打个招呼吧~</div>
                </div>
              )}
              {messages.map((msg) => {
                const isSelf = msg.userId === currentUser.id;
                return (
                  <div key={msg.id} className={`message ${isSelf ? 'self' : ''}`}>
                    <div
                      className="message-avatar"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        background: 'var(--cream-dark)',
                      }}
                    >
                      {msg.user.avatar}
                    </div>
                    <div className="message-body">
                      <div className="message-meta">
                        {!isSelf && <span>{msg.user.nickname}</span>}
                        <span>{formatMessageTime(msg.timestamp)}</span>
                      </div>
                      <div className="message-bubble">{msg.content}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-wrap">
              <input
                type="text"
                className="chat-input"
                placeholder="和大家聊一聊要准备什么菜~"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={200}
              />
              <button
                className="chat-send"
                onClick={handleSendMessage}
                disabled={!chatInput.trim()}
              >
                <Send size={18} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableDetail;
