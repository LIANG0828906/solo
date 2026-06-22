import React, { useEffect, useRef } from 'react';
import { LogEntry } from './GameEngine';

interface EventLogProps {
  logs: LogEntry[];
}

const TYPE_COLORS: Record<string, string> = {
  threat: '#FF6B6B',
  effect: '#66FCF1',
  system: '#C5C6C7',
  warning: '#FFA94D',
  victory: '#51CF66',
  defeat: '#F33535',
};

const TYPE_ICONS: Record<string, string> = {
  threat: '⚠',
  effect: '↻',
  system: 'ℹ',
  warning: '!',
  victory: '★',
  defeat: '✕',
};

const EventLog: React.FC<EventLogProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      width: 280,
      height: '100%',
      background: 'rgba(31, 40, 51, 0.85)',
      backdropFilter: 'blur(10px)',
      borderLeft: '1px solid rgba(69, 162, 158, 0.3)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid rgba(69, 162, 158, 0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{
          fontSize: 13,
          fontWeight: 700,
          color: '#66FCF1',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
        }}>
          事件日志
        </span>
        <div style={{
          width: 6, height: 6,
          borderRadius: '50%',
          background: '#66FCF1',
          boxShadow: '0 0 8px #66FCF1',
        }} />
      </div>

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 12px',
          scrollbarWidth: 'thin',
          scrollbarColor: '#45A29E transparent',
        }}
      >
        <style>{`
          div::-webkit-scrollbar { width: 4px; }
          div::-webkit-scrollbar-track { background: transparent; }
          div::-webkit-scrollbar-thumb { background: #45A29E; border-radius: 2px; }
        `}</style>
        {logs.length === 0 ? (
          <div style={{
            color: 'rgba(197, 198, 199, 0.4)',
            fontSize: 12,
            textAlign: 'center',
            padding: '30px 10px',
          }}>
            等待系统事件...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {logs.map((log) => {
              const color = TYPE_COLORS[log.type] || '#C5C6C7';
              const icon = TYPE_ICONS[log.type] || '•';
              const isThreat = log.type === 'threat';

              return (
                <div
                  key={log.id}
                  className="fade-in"
                  style={{
                    padding: '8px 10px',
                    background: isThreat
                      ? 'rgba(255, 107, 107, 0.08)'
                      : log.type === 'victory'
                      ? 'rgba(81, 207, 102, 0.12)'
                      : log.type === 'defeat'
                      ? 'rgba(243, 53, 53, 0.12)'
                      : 'rgba(102, 252, 241, 0.04)',
                    borderRadius: 8,
                    border: `1px solid ${color}20`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span
                      className={isThreat ? 'warning-blink' : ''}
                      style={{
                        width: 18, height: 18,
                        borderRadius: 4,
                        background: `${color}25`,
                        color: color,
                        fontSize: 11,
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        lineHeight: 1,
                        paddingTop: 1,
                      }}
                    >
                      {icon}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12,
                        color: '#fff',
                        lineHeight: 1.45,
                        wordBreak: 'break-word',
                      }}>
                        {log.message}
                      </div>
                      <div style={{
                        fontSize: 10,
                        color: 'rgba(197, 198, 199, 0.5)',
                        marginTop: 4,
                      }}>
                        {formatTime(log.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventLog;
