import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

const EventLog: React.FC = () => {
  const eventLog = useGameStore((s) => s.eventLog);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [eventLog]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 80,
        right: 12,
        width: 220,
        maxHeight: 180,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: '4px 8px',
        pointerEvents: 'none',
        fontSize: 10,
        fontFamily: "'Segoe UI', sans-serif",
        scrollbarWidth: 'none',
      }}
    >
      {eventLog.map((entry) => (
        <div
          key={entry.id}
          style={{
            color: entry.color,
            opacity: 0.85,
            animation: 'fadeInLog 0.3s ease-in',
            textShadow: `0 0 4px ${entry.color}`,
            lineHeight: 1.4,
          }}
        >
          {entry.text}
        </div>
      ))}
      <style>{`
        @keyframes fadeInLog {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 0.85; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default EventLog;
