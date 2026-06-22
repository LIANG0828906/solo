import React from 'react';
import { useActiveNotifications } from '../store/gameStore';
import { GameEvent } from '../types/gameTypes';
import './EventNotification.css';

const EventNotification: React.FC = () => {
  const notifications = useActiveNotifications();

  const getEventIcon = (type: string): string => {
    switch (type) {
      case 'earthquake': return '🌋';
      case 'prosperity': return '📈';
      case 'pollution': return '☁️';
      default: return '⚠️';
    }
  };

  return (
    <div className="event-notifications">
      {notifications.map((event: GameEvent) => (
        <div
          key={event.id}
          className={`event-card ${event.isPositive ? 'positive' : 'negative'}`}
        >
          <div className="event-icon">
            {getEventIcon(event.type)}
          </div>
          <div className="event-content">
            <h4 className="event-title">{event.name}</h4>
            <p className="event-description">{event.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventNotification;
