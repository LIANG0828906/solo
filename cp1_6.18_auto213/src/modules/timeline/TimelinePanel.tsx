import React, { useRef, useState, useEffect } from 'react';
import { events, formatYear } from './timelineData';
import type { TimelineEvent } from '../../types';

interface TimelinePanelProps {
  selectedEventId: string | null;
  onEventSelect: (id: string) => void;
}

export const TimelinePanel: React.FC<TimelinePanelProps> = ({
  selectedEventId,
  onEventSelect
}) => {
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [connectionLineStyle, setConnectionLineStyle] = useState<{
    left: string;
    height: string;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const eventRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (selectedEventId && containerRef.current) {
      const eventElement = eventRefs.current.get(selectedEventId);
      if (eventElement) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const eventRect = eventElement.getBoundingClientRect();
        
        const left = eventRect.left - containerRect.left + eventRect.width / 2;
        const height = containerRect.height;
        
        setConnectionLineStyle({
          left: `${left}px`,
          height: `${height}px`
        });
      }
    } else {
      setConnectionLineStyle(null);
    }
  }, [selectedEventId]);

  const handleEventClick = (event: TimelineEvent) => {
    if (selectedEventId !== event.id) {
      onEventSelect(event.id);
    }
  };

  const registerEventRef = (id: string, element: HTMLDivElement | null) => {
    if (element) {
      eventRefs.current.set(id, element);
    }
  };

  return (
    <div className="timeline-panel" ref={containerRef}>
      <div className="timeline-track" />
      
      {connectionLineStyle && (
        <div
          className={`connection-line ${selectedEventId ? 'active' : ''}`}
          style={{
            left: connectionLineStyle.left,
            height: connectionLineStyle.height
          }}
        />
      )}
      
      <div className="timeline-events">
        {events.map((event) => (
          <div
            key={event.id}
            ref={(el) => registerEventRef(event.id, el)}
            className={`timeline-event ${selectedEventId === event.id ? 'selected' : ''}`}
            onClick={() => handleEventClick(event)}
            onMouseEnter={() => setHoveredEventId(event.id)}
            onMouseLeave={() => setHoveredEventId(null)}
          >
            {hoveredEventId === event.id && (
              <div className="event-tooltip">
                {event.title}
              </div>
            )}
            
            <div
              className="event-node"
              style={{ backgroundColor: event.color }}
            >
              {event.icon}
            </div>
            
            <div className="event-year">
              {formatYear(event.year)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
