import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { GameEvent } from '../../store/types';

const EventLog: React.FC = () => {
  const events = useGameStore((s) => s.events);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [events.length]);

  const getEventColor = (type: GameEvent['type']): string => {
    switch (type) {
      case 'success':
        return '#64ffda';
      case 'warning':
        return '#ecc94b';
      case 'danger':
        return '#f56565';
      default:
        return '#8892b0';
    }
  };

  const getEventIcon = (type: GameEvent['type']): string => {
    switch (type) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'danger':
        return '✕';
      default:
        return '•';
    }
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div
      className="glass-panel glow-panel p-4"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: '#64ffda', fontSize: 16, fontWeight: 600 }}>
          📜 探索日志
        </h3>
        <span
          style={{
            fontSize: 11,
            color: '#5a6a85',
            fontFamily: 'monospace',
          }}
        >
          {events.length}条
        </span>
      </div>

      <div
        ref={containerRef}
        className="scrollbar-thin"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          paddingRight: 4,
        }}
      >
        {events.map((event, index) => (
          <div
            key={event.id}
            style={{
              padding: '8px 10px',
              borderRadius: 6,
              backgroundColor: index === 0 ? 'rgba(100, 255, 218, 0.05)' : 'transparent',
              borderLeft: `3px solid ${getEventColor(event.type)}`,
              animation: index === 0 ? 'fadeIn 0.3s ease-out' : undefined,
              display: 'flex',
              gap: 8,
              alignItems: 'flex-start',
            }}
          >
            <span
              style={{
                color: getEventColor(event.type),
                fontSize: 12,
                flexShrink: 0,
                marginTop: 1,
                width: 14,
                textAlign: 'center',
              }}
            >
              {getEventIcon(event.type)}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 12,
                  color: event.type === 'danger' ? '#f56565' : event.type === 'warning' ? '#ecc94b' : '#ccd6f6',
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                }}
              >
                {event.message}
              </p>
              <div
                style={{
                  fontSize: 10,
                  color: '#5a6a85',
                  marginTop: 2,
                  fontFamily: 'monospace',
                }}
              >
                {formatTime(event.timestamp)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventLog;
