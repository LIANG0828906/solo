import React from 'react';
import type { Artifact, TimelineEvent } from '../types';

interface InfoCardProps {
  artifact: Artifact;
  visible: boolean;
  onClose: () => void;
  onRelatedEventClick: (eventId: string) => void;
  events: TimelineEvent[];
}

export const InfoCard: React.FC<InfoCardProps> = ({
  artifact,
  visible,
  onClose,
  onRelatedEventClick,
  events
}) => {
  const getRelatedEventTitles = (relatedIds: string[]) => {
    return relatedIds
      .map(id => events.find(e => e.id === id))
      .filter(Boolean) as TimelineEvent[];
  };

  const relatedEvents = getRelatedEventTitles(artifact.relatedEvents);

  return (
    <div 
      className={`info-card ${visible ? 'visible' : ''}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(50px)'
      }}
    >
      <button
        className="info-card-close"
        onClick={onClose}
        aria-label="关闭信息卡片"
      >
        ×
      </button>
      
      <h2 className="info-card-title">{artifact.name}</h2>
      
      <div className="info-card-meta">
        <span className="info-card-tag">{artifact.era}</span>
        <span className="info-card-tag">{artifact.civilization}</span>
      </div>
      
      <p className="info-card-description">
        {artifact.description}
      </p>
      
      {relatedEvents.length > 0 && (
        <div className="info-card-related">
          <h3 className="related-title">探索更多</h3>
          <div className="related-buttons">
            {relatedEvents.map((event) => (
              <button
                key={event.id}
                className="related-btn"
                onClick={() => onRelatedEventClick(event.id)}
              >
                {event.icon} {event.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
