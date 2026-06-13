import type { Event } from '../types';

interface EventListProps {
  events: Event[];
  onEventClick: (event: Event) => void;
}

export default function EventList({ events, onEventClick }: EventListProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusLabel = (status: Event['status']) => {
    switch (status) {
      case 'ongoing':
        return '进行中';
      case 'upcoming':
        return '即将开始';
      case 'ended':
        return '已结束';
    }
  };

  return (
    <div className="event-list event-list-fade">
      {events.map(event => (
        <div key={event.id} className="event-card" onClick={() => onEventClick(event)}>
          <div className="event-card-header">
            <h3 className="event-card-title">{event.title}</h3>
            <span className={'event-status ' + event.status}>
              {getStatusLabel(event.status)}
            </span>
          </div>

          <div className="event-card-info">
            <div className="event-info-item">
              <span className="event-info-icon">🕐</span>
              <span>{formatDate(event.startTime)}</span>
            </div>
            <div className="event-info-item">
              <span className="event-info-icon">📍</span>
              <span>{event.location}</span>
            </div>
          </div>

          <div className="event-card-footer">
            <span className="event-checkin-count">
              签到: <strong>{event.checkInCount}</strong> / {event.maxParticipants}
            </span>
            <span className="event-card-code">{event.code}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
