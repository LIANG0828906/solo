import { useState, useEffect, useRef } from 'react';
import { useEventStore } from '../store/eventStore';
import { useUserStore } from '../store/userStore';
import {
  createEvent,
  registerEvent,
  cancelRegistration,
  getAllEvents,
  getFillPercentage,
  isFull,
  isRegistered,
  getRemainingSpots,
  formatEventDate,
} from '../modules/community/CommunityManager';
import type { CommunityEvent } from '../types';

export default function EventsPage() {
  const events = useEventStore((s) => s.events);
  const userId = useUserStore((s) => s.userId);
  const isAdmin = useUserStore((s) => s.isAdmin);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [timelineRef, setTimelineRef] = useState<HTMLDivElement | null>(null);
  const [glowPos, setGlowPos] = useState<number | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [location, setLocation] = useState('');
  const [maxAttendees, setMaxAttendees] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!timelineRef) return;
    const rect = timelineRef.getBoundingClientRect();
    const y = e.clientY - rect.top;
    setGlowPos(y);
  };

  const handleMouseLeave = () => {
    setGlowPos(null);
  };

  const sortedEvents = [...events].sort((a, b) => a.date - b.date);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !dateStr || !timeStr || !location.trim()) return;

    const date = new Date(`${dateStr}T${timeStr}`).getTime();
    if (isNaN(date)) return;

    setIsSubmitting(true);
    try {
      await createEvent({
        title: title.trim(),
        description: description.trim(),
        date,
        location: location.trim(),
        maxAttendees: Math.max(1, maxAttendees),
      });
      setMessage({ type: 'success', text: '活动创建成功' });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setDateStr('');
      setTimeStr('');
      setLocation('');
      setMaxAttendees(30);
    } catch {
      setMessage({ type: 'error', text: '活动创建失败' });
    }
    setIsSubmitting(false);
  };

  const handleRegister = async (eventId: string) => {
    const success = await registerEvent(eventId, userId);
    if (success) {
      setMessage({ type: 'success', text: '报名成功' });
    } else {
      setMessage({ type: 'error', text: '报名失败，可能名额已满或已报名' });
    }
  };

  const handleCancel = async (eventId: string) => {
    await cancelRegistration(eventId, userId);
    setMessage({ type: 'success', text: '已取消报名' });
  };

  const getGradientStyle = (percentage: number) => {
    const hue = (1 - percentage / 100) * 120;
    return `linear-gradient(90deg, hsl(${hue}, 70%, 50%) 0%, hsl(${Math.max(0, hue - 30)}, 70%, 50%) 100%)`;
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  return (
    <div className="page events-page">
      <div className="page-header">
        <div>
          <h1>社区活动</h1>
          <p className="page-subtitle">共 {sortedEvents.length} 场活动</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            创建活动
          </button>
        )}
      </div>

      {message && (
        <div className={`toast ${message.type}`}>
          {message.type === 'success' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
          {message.text}
        </div>
      )}

      {sortedEvents.length === 0 ? (
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <p>暂无活动，快去创建第一场活动吧！</p>
        </div>
      ) : (
        <div
          className="timeline"
          ref={setTimelineRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="timeline-line" />
          {glowPos !== null && (
            <div
              className="timeline-glow"
              style={{ top: glowPos }}
            />
          )}

          {sortedEvents.map((event, idx) => (
            <TimelineEvent
              key={event.eventId}
              event={event}
              index={idx}
              userId={userId}
              isAdmin={isAdmin}
              isRegistered={isRegistered(event, userId)}
              isFull={isFull(event)}
              fillPercentage={getFillPercentage(event)}
              remaining={getRemainingSpots(event)}
              onRegister={() => handleRegister(event.eventId)}
              onCancel={() => handleCancel(event.eventId)}
              formatEventDate={formatEventDate}
              getGradientStyle={getGradientStyle}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>创建新活动</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)} aria-label="关闭">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="form">
              <div className="form-group">
                <label>活动标题 *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="请输入活动标题"
                  required
                />
              </div>
              <div className="form-group">
                <label>活动描述 *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="请输入活动描述"
                  rows={4}
                  required
                />
              </div>
              <div className="form-row form-row-inline">
                <div className="form-group">
                  <label>活动日期 *</label>
                  <input
                    type="date"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>活动时间 *</label>
                  <input
                    type="time"
                    value={timeStr}
                    onChange={(e) => setTimeStr(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-row form-row-inline">
                <div className="form-group flex-2">
                  <label>活动地点 *</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="如：社区活动中心"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>最大人数 *</label>
                  <input
                    type="number"
                    min={1}
                    value={maxAttendees}
                    onChange={(e) => setMaxAttendees(parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? '创建中...' : '确认创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface TimelineEventProps {
  event: CommunityEvent;
  index: number;
  userId: string;
  isAdmin: boolean;
  isRegistered: boolean;
  isFull: boolean;
  fillPercentage: number;
  remaining: number;
  onRegister: () => void;
  onCancel: () => void;
  formatEventDate: (d: number) => string;
  getGradientStyle: (p: number) => string;
  formatDate: (d: number) => string;
}

function TimelineEvent({
  event,
  index,
  isRegistered,
  isFull,
  fillPercentage,
  remaining,
  onRegister,
  onCancel,
  formatEventDate,
  getGradientStyle,
  formatDate,
}: TimelineEventProps) {
  const isPast = event.date < Date.now();

  return (
    <div className="timeline-item" style={{ animationDelay: `${index * 100}ms` }}>
      <div className="timeline-node">
        <div className="timeline-node-inner" />
      </div>

      <div className="event-card">
        <div className="event-card-header">
          <div className="event-card-date">
            <p className="ec-month">{formatDate(event.date).split('月')[0]}月</p>
            <p className="ec-day">{formatDate(event.date).split('月')[1]}</p>
          </div>
          <div className="event-card-title">
            <h3>{event.title}</h3>
            <p className="event-meta">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {formatEventDate(event.date)}
            </p>
            <p className="event-meta">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {event.location}
            </p>
          </div>
        </div>

        <p className="event-description">{event.description}</p>

        <div className="event-progress">
          <div className="progress-info">
            <span>报名进度</span>
            <span>
              {event.registeredIds.length} / {event.maxAttendees}
              {!isPast && !isFull && <span className="remaining"> · 剩余 {remaining} 名</span>}
            </span>
          </div>
          <div className="progress-bar-wrapper large">
            <div
              className="progress-bar"
              style={{
                width: `${fillPercentage}%`,
                background: getGradientStyle(fillPercentage),
              }}
            />
          </div>
        </div>

        <div className="event-card-actions">
          {isPast ? (
            <span className="status-pill returned">已结束</span>
          ) : isRegistered ? (
            <button className="btn btn-outline btn-danger" onClick={onCancel}>
              取消报名
            </button>
          ) : isFull ? (
            <button className="btn btn-disabled" disabled>
              已满
            </button>
          ) : (
            <button className="btn btn-primary" onClick={onRegister}>
              立即报名
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
