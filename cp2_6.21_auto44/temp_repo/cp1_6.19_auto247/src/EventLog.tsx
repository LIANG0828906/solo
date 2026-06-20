import React, { useRef, useEffect } from 'react';
import { GameEvent } from './GameEngine';

interface EventLogProps {
  events: GameEvent[];
  currentRound: number;
  totalRounds: number;
}

const EventLog: React.FC<EventLogProps> = ({ events, currentRound, totalRounds }) => {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = 0;
    }
  }, [events]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getEventTypeLabel = (type: GameEvent['type']) => {
    switch (type) {
      case 'fault': return '故障';
      case 'action': return '操作';
      case 'round_end': return '回合结束';
      case 'game_end': return '游戏结束';
      default: return '事件';
    }
  };

  const getEventTypeColor = (type: GameEvent['type']) => {
    switch (type) {
      case 'fault': return '#FF9800';
      case 'action': return '#2196F3';
      case 'round_end': return '#9C27B0';
      case 'game_end': return '#E91E63';
      default: return '#9E9E9E';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>事件日志</h2>
        <div style={styles.roundInfo}>
          <span style={styles.roundLabel}>第 {currentRound} / {totalRounds} 轮</span>
        </div>
      </div>

      <div ref={logRef} style={styles.logContainer}>
        <div style={styles.timeline}>
          {events.length === 0 ? (
            <p style={styles.emptyLog}>暂无事件记录...</p>
          ) : (
            events.map((event, index) => (
              <div
                key={event.id}
                style={{
                  ...styles.eventItem,
                  borderLeftColor: event.success ? '#4CAF50' : '#F44336',
                  opacity: index === 0 ? 1 : 0.85
                }}
              >
                <div style={styles.eventHeader}>
                  <span
                    style={{
                      ...styles.eventType,
                      background: getEventTypeColor(event.type)
                    }}
                  >
                    {getEventTypeLabel(event.type)}
                  </span>
                  <span style={styles.eventTime}>{formatTime(event.time)}</span>
                </div>
                <p style={{
                  ...styles.eventDesc,
                  color: event.success ? '#E0E0E0' : '#FF8A80'
                }}>
                  {event.description}
                </p>
                {event.reason && (
                  <p style={styles.eventReason}>原因: {event.reason}</p>
                )}
                {event.snapshot && (
                  <div style={styles.snapshot}>
                    <span style={styles.snapshotLabel}>状态快照:</span>
                    <div style={styles.snapshotValues}>
                      <span>水位 {event.snapshot.waterLevel.toFixed(0)}%</span>
                      <span>氧气 {event.snapshot.oxygen.toFixed(1)}%</span>
                      <span>温度 {event.snapshot.temperature.toFixed(0)}°C</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid #3D3D5C',
    borderRadius: '16px',
    padding: '24px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  title: {
    margin: 0,
    color: '#E0E0E0',
    fontSize: '20px',
    fontWeight: 600
  },
  roundInfo: {
    display: 'flex',
    alignItems: 'center'
  },
  roundLabel: {
    color: '#9C27B0',
    fontSize: '14px',
    fontWeight: 600,
    background: 'rgba(156, 39, 176, 0.2)',
    padding: '4px 12px',
    borderRadius: '12px'
  },
  logContainer: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden'
  },
  timeline: {
    position: 'relative',
    paddingLeft: '0'
  },
  eventItem: {
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '10px',
    borderLeft: '3px solid',
    transition: 'all 0.2s ease'
  },
  eventHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px'
  },
  eventType: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#fff',
    padding: '2px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase'
  },
  eventTime: {
    color: '#757575',
    fontSize: '12px',
    fontFamily: 'monospace'
  },
  eventDesc: {
    margin: '0 0 4px 0',
    fontSize: '13px',
    lineHeight: 1.4
  },
  eventReason: {
    margin: '4px 0 0 0',
    color: '#FF9800',
    fontSize: '12px'
  },
  snapshot: {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px dashed #3D3D5C'
  },
  snapshotLabel: {
    color: '#757575',
    fontSize: '11px',
    display: 'block',
    marginBottom: '4px'
  },
  snapshotValues: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap'
  },
  emptyLog: {
    color: '#616161',
    textAlign: 'center',
    padding: '40px 0',
    fontSize: '14px'
  }
};

export default EventLog;
