import { useState, useMemo, memo, useRef, useEffect } from 'react';
import { useEventStore } from '../../store/eventStore';
import { Event as EventType, EventStatus } from '../../types';
import { formatDate } from '../../utils/helpers';
import './EventList.css';

interface EventListProps {
  onEventClick: (eventId: string) => void;
}

const EventCard = memo(function EventCard({
  event,
  onClick,
}: {
  event: EventType;
  onClick: () => void;
}) {
  const statusText = {
    upcoming: '即将开始',
    ongoing: '进行中',
    ended: '已结束',
  };

  return (
    <div className="event-card" onClick={onClick}>
      <div
        className="event-card-cover"
        style={{ background: `linear-gradient(135deg, ${event.coverColor}, ${event.coverColor}dd)` }}
      >
        <div className="event-card-cover-pattern">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="15" fill="rgba(255,255,255,0.1)" />
            <circle cx="80" cy="60" r="25" fill="rgba(255,255,255,0.08)" />
            <path d="M10 80 Q50 50 90 80" stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none" />
          </svg>
        </div>
        <span className={`event-card-status ${event.status}`}>
          <span className={`status-dot ${event.status === 'ongoing' ? 'pulse' : ''}`}></span>
          {statusText[event.status]}
        </span>
      </div>
      <div className="event-card-content">
        <h3 className="event-card-title">{event.title}</h3>
        <div className="event-card-meta">
          <div className="meta-item">
            <svg className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{formatDate(event.startDate)}</span>
          </div>
          <div className="meta-item">
            <svg className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{event.location}</span>
          </div>
        </div>
        <div className="event-card-footer">
          <div className="registration-count">
            <svg className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>{event.registrationCount} 人报名</span>
          </div>
          <span className="card-arrow">→</span>
        </div>
      </div>
    </div>
  );
});

function EventList({ onEventClick }: EventListProps) {
  const { events, loading } = useEventStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const inputEl = searchInputRef.current;
    if (!inputEl) return;

    const handleNativeInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.value !== searchQuery) {
        setSearchQuery(target.value);
      }
    };

    inputEl.addEventListener('input', handleNativeInput);
    inputEl.addEventListener('change', handleNativeInput);

    return () => {
      inputEl.removeEventListener('input', handleNativeInput);
      inputEl.removeEventListener('change', handleNativeInput);
    };
  }, [searchQuery]);

  const filteredEvents = useMemo(() => {
    const startTime = performance.now();
    const query = searchQuery.toLowerCase().trim();
    const result = events.filter((event) => {
      const matchesQuery = !query ||
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
    const duration = performance.now() - startTime;
    if (duration > 50) {
      console.warn(`搜索耗时: ${duration.toFixed(2)}ms`);
    }
    return result;
  }, [events, searchQuery, statusFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value as EventStatus | 'all');
  };

  return (
    <div className="event-list-page">
      <div className="page-header">
        <h1 className="page-title">探索精彩活动</h1>
        <p className="page-subtitle">发现并参与你感兴趣的活动</p>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            ref={searchInputRef}
            className="search-input"
            placeholder="搜索活动名称..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={handleFilterChange}
        >
          <option value="all">全部状态</option>
          <option value="upcoming">即将开始</option>
          <option value="ongoing">进行中</option>
          <option value="ended">已结束</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      ) : (
        <>
          <div className="results-count">
            共找到 <span className="count-highlight">{filteredEvents.length}</span> 个活动
          </div>

          {filteredEvents.length > 0 ? (
            <div className="event-grid">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => onEventClick(event.id)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h3>暂无活动</h3>
              <p>没有找到符合条件的活动，请尝试其他搜索条件</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default memo(EventList);
