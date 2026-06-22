import { EventData, ParticipantData } from './types';

interface EventListProps {
  events: EventData[];
  participants: ParticipantData[];
  onEventClick: (eventId: string) => void;
}

function EventList({ events, participants, onEventClick }: EventListProps) {
  if (events.length === 0) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
        <p>暂无活动，点击右上角"创建活动"开始</p>
      </div>
    );
  }

  return (
    <div className="events-grid">
      {events.map((event) => {
        const totalCapacity = event.maxCapacity;
        const registeredCount = participants.filter((p) => p.eventId === event.id).length;
        const progressPercent = Math.min((registeredCount / totalCapacity) * 100, 100);

        return (
          <div
            key={event.id}
            className="event-card"
            onClick={() => onEventClick(event.id)}
          >
            <div>
              <h3>{event.name}</h3>
              <div className="info">
                📅 {event.date} {event.time}
              </div>
              <div className="info">📍 {event.location}</div>
            </div>
            <div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="progress-text">
                报名人数：{registeredCount} / {totalCapacity}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default EventList;
