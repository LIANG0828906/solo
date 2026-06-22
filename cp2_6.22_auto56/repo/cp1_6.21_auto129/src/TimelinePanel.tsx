import React, { useEffect, useRef, memo } from 'react';
import { EditEvent, User } from './types';

interface Props {
  events: EditEvent[];
  users: User[];
  onCardClick: (event: EditEvent) => void;
}

interface CardProps {
  event: EditEvent;
  user: User | undefined;
  onClick: () => void;
}

const TimelineCard = memo<CardProps>(({ event, user, onClick }) => {
  const time = new Date(event.timestamp);
  const hh = String(time.getHours()).padStart(2, '0');
  const mm = String(time.getMinutes()).padStart(2, '0');
  const ss = String(time.getSeconds()).padStart(2, '0');

  const displayText =
    event.text.length > 5
      ? event.text.slice(0, 5) + '...'
      : event.text;

  return (
    <div className="timeline-card" onClick={onClick}>
      <div
        className="timeline-timeline-dot"
        style={{ backgroundColor: user?.color || '#94A3B8' }}
      >
        {user?.name?.charAt(0) || '?'}
      </div>
      <div className="timeline-body">
        <div className="timeline-op-row">
          <div
            className={`timeline-op-icon ${event.type === 'insert' ? 'insert' : 'delete'}`}
          >
            {event.type === 'insert' ? '+' : '−'}
          </div>
          <span className="timeline-text">{displayText}</span>
        </div>
        <div className="timeline-time">
          {hh}:{mm}:{ss}
        </div>
      </div>
    </div>
  );
});

TimelineCard.displayName = 'TimelineCard';

const TimelinePanel: React.FC<Props> = ({ events, users, onCardClick }) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [events.length]);

  return (
    <>
      <div className="sidebar-header">
        <span>编辑轨迹</span>
        <span className="sidebar-count">{events.length} 条</span>
      </div>
      <div className="timeline-list" ref={listRef}>
        {events.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              color: '#94A3B8',
              fontSize: 13,
              padding: '40px 0',
            }}
          >
            暂无编辑轨迹
          </div>
        )}
        {events.map(event => (
          <TimelineCard
            key={event.id}
            event={event}
            user={users.find(u => u.id === event.userId)}
            onClick={() => onCardClick(event)}
          />
        ))}
      </div>
    </>
  );
};

export default TimelinePanel;
