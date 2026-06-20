import React from 'react';
import { Event } from '../types';
import { useStore } from '../store';

interface EventCardProps {
  event: Event;
  isNew: boolean;
  isSelected: boolean;
  onSelect: (event: Event) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, isNew, isSelected, onSelect }) => {
  const ratio = event.currentParticipants / event.maxParticipants;
  const isHigh = ratio > 0.8;

  return (
    <div
      className={`event-card ${isNew ? 'event-card-new' : ''} ${isSelected ? 'event-card-selected' : ''}`}
      onClick={() => onSelect(event)}
    >
      <div className="event-card-title">{event.title}</div>
      <div className="event-card-meta">📅 {event.date} {event.time}</div>
      <div className="event-card-meta">📍 {event.location}</div>
      <div className="event-card-footer">
        <span
          className="event-card-seats"
          style={{ color: isHigh ? '#FF7043' : '#666' }}
        >
          {event.currentParticipants}/{event.maxParticipants}
        </span>
        <span className="event-card-likes">❤️ {event.likes}</span>
      </div>
    </div>
  );
};

export default EventCard;
