import React from 'react';
import type { Question } from '../types';
import { ERA_COLORS } from '../types';

interface EventCardProps {
  question: Question;
  index: number;
  isDragging?: boolean;
}

const EventCard: React.FC<EventCardProps> = React.memo(({ question, isDragging }) => {
  const eraColor = ERA_COLORS[question.era];

  return (
    <div
      className="event-card-wrapper"
      style={{
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        boxShadow: isDragging
          ? '0 12px 24px rgba(0, 0, 0, 0.2)'
          : '0 2px 8px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
      }}
    >
      <div
        className="event-card"
        style={{
          background: '#FFF8E7',
          borderRadius: '12px',
          borderLeft: `5px solid ${eraColor}`,
          padding: '16px 20px',
          cursor: 'grab',
          userSelect: 'none',
        }}
      >
        <div
          className="event-index"
          style={{
            display: 'inline-block',
            background: eraColor,
            color: '#fff',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            textAlign: 'center',
            lineHeight: '24px',
            fontSize: '12px',
            fontWeight: 'bold',
            marginRight: '10px',
            verticalAlign: 'middle',
          }}
        >
          {question.year < 0 ? `${Math.abs(question.year)}BC` : question.year}
        </div>
        <span
          style={{
            color: '#8D6E63',
            fontSize: '12px',
            verticalAlign: 'middle',
          }}
        >
          {question.era}
        </span>
        <h3
          className="event-title"
          style={{
            fontWeight: 'bold',
            fontSize: '18px',
            color: '#3E2723',
            margin: '8px 0 6px 0',
            lineHeight: '1.4',
          }}
        >
          {question.event}
        </h3>
        <p
          className="event-desc"
          style={{
            fontSize: '14px',
            color: '#6D4C41',
            margin: 0,
            lineHeight: '1.5',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {question.description}
        </p>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .event-title {
            font-size: 16px !important;
          }
          .event-desc {
            font-size: 12px !important;
          }
        }
      `}</style>
    </div>
  );
});

EventCard.displayName = 'EventCard';

export default EventCard;
