import React from 'react';
import { Event } from './types';

interface EventListProps {
  events: Event[];
  onEnroll: (event: Event) => void;
  newEventId: string | null;
}

const EventList: React.FC<EventListProps> = ({ events, onEnroll, newEventId }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (events.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">📅</div>
        <p>暂无活动，快去创建第一个活动吧！</p>
      </div>
    );
  }

  return (
    <div className="event-grid">
      {events.map(event => {
        const enrolledCount = event.participants.length;
        const isFull = enrolledCount >= event.capacity;
        const capacityPercent = (enrolledCount / event.capacity) * 100;

        return (
          <div
            key={event.id}
            className={`event-card ${newEventId === event.id ? 'new' : ''}`}
          >
            <h3>{event.name}</h3>
            <div className="event-info">
              <p><span className="icon">📅</span> {formatDate(event.date)}</p>
              <p><span className="icon">⏱️</span> {event.duration} 分钟</p>
              <p><span className="icon">📍</span> {event.location}</p>
            </div>
            <div className="capacity-bar">
              <div
                className="capacity-fill"
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
            <div className="capacity-text">
              已报名 {enrolledCount} / {event.capacity} 人
            </div>
            <button
              className={`btn ${isFull ? '' : 'btn-primary'}`}
              onClick={() => !isFull && onEnroll(event)}
              disabled={isFull}
            >
              {isFull ? '名额已满' : '立即报名'}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default EventList;
