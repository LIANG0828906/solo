import { useEffect, useRef } from 'react';
import { useGameStore } from './gameStore';

export default function LogPanel() {
  const { combatLogs } = useGameStore();
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [combatLogs]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'damage':
        return '#E74C3C';
      case 'skill':
        return '#9B59B6';
      case 'move':
        return '#3498DB';
      default:
        return '#BDC3C7';
    }
  };

  return (
    <div
      style={{
        width: 240,
        backgroundColor: '#34495E',
        borderRadius: 8,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxSizing: 'border-box',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      <div
        style={{
          fontSize: 16,
          fontWeight: 'bold',
          color: '#1ABC9C',
          marginBottom: 12,
          paddingBottom: 8,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        战斗日志
      </div>

      <div
        ref={logRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          scrollbarWidth: 'thin',
          scrollbarColor: '#1ABC9C #2C3E50',
        }}
      >
        {combatLogs.map(log => (
          <div
            key={log.id}
            style={{
              height: 28,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '0 6px',
              borderRadius: 4,
              cursor: 'default',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span
              style={{
                color: '#7F8C8D',
                fontSize: 11,
                minWidth: 60,
                flexShrink: 0,
              }}
            >
              {formatTime(log.timestamp)}
            </span>
            <span style={{ color: getTypeColor(log.type) }}>
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
