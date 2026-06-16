import { useState, useRef, useEffect, useMemo } from 'react';
import { useCombatStore, LogType } from './store';

const LOG_COLORS: Record<LogType, string> = {
  attack: '#FF5252',
  defense: '#69F0AE',
  special: '#CE93D8',
};

const LOG_ICONS: Record<LogType, string> = {
  attack: '⚔️',
  defense: '🛡️',
  special: '✨',
};

const VISIBLE_COUNT = 20;
const ITEM_HEIGHT = 48;

export default function CombatLog() {
  const { logs } = useCombatStore((state) => state);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const visibleLogs = useMemo(() => {
    const startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
    const endIndex = Math.min(startIndex + VISIBLE_COUNT + 2, logs.length);
    return logs.slice(startIndex, endIndex).map((log, i) => ({
      ...log,
      index: startIndex + i,
    }));
  }, [logs, scrollTop]);

  useEffect(() => {
    setScrollTop(0);
  }, [logs.length > 0 ? logs[0].id : null]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const totalHeight = logs.length * ITEM_HEIGHT;
  const offsetY = Math.floor(scrollTop / ITEM_HEIGHT) * ITEM_HEIGHT;

  return (
    <div
      ref={containerRef}
      style={{
        width: '280px',
        height: '800px',
        background: 'rgba(37, 37, 38, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid #333',
        borderRadius: '6px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid #333',
          background: 'rgba(0, 0, 0, 0.3)',
        }}
      >
        <h3
          style={{
            margin: 0,
            color: '#E0E0E0',
            fontSize: '14px',
            fontWeight: 600,
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '16px' }}>📜</span>
          战斗日志
        </h3>
        <div style={{ color: '#666', fontSize: '11px', marginTop: '4px' }}>
          共 {logs.length} 条记录
        </div>
      </div>

      <div
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: '#444 transparent',
        }}
      >
        <style>{`
          div::-webkit-scrollbar {
            width: 6px;
          }
          div::-webkit-scrollbar-track {
            background: transparent;
          }
          div::-webkit-scrollbar-thumb {
            background: #444;
            border-radius: 3px;
          }
          div::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        `}</style>

        {logs.length === 0 ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#555',
              fontSize: '12px',
              padding: '20px',
              textAlign: 'center',
            }}
          >
            战斗尚未开始<br />点击 START 开始对决
          </div>
        ) : (
          <div style={{ height: totalHeight, position: 'relative' }}>
            <div style={{ transform: `translateY(${offsetY}px)` }}>
              {visibleLogs.map((log) => {
                const opacity = log.index < 10 ? 1 : Math.max(0.2, 1 - (log.index - 10) * 0.05);
                return (
                  <div
                    key={log.id}
                    style={{
                      height: ITEM_HEIGHT,
                      padding: '8px 12px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'flex-start',
                      opacity,
                      transition: 'opacity 0.3s ease',
                      boxSizing: 'border-box',
                    }}
                  >
                    <span style={{ fontSize: '14px', lineHeight: '1.4' }}>
                      {LOG_ICONS[log.type]}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          color: LOG_COLORS[log.type],
                          fontSize: '11px',
                          fontFamily: "'JetBrains Mono', monospace",
                          marginBottom: '2px',
                        }}
                      >
                        回合 {log.round}
                      </div>
                      <div
                        style={{
                          color: '#E0E0E0',
                          fontSize: '12px',
                          lineHeight: '1.3',
                          wordBreak: 'break-word',
                        }}
                      >
                        {log.message}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          padding: '8px 12px',
          borderTop: '1px solid #333',
          background: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          gap: '12px',
          fontSize: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>⚔️</span>
          <span style={{ color: '#FF5252' }}>攻击</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>🛡️</span>
          <span style={{ color: '#69F0AE' }}>防御</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>✨</span>
          <span style={{ color: '#CE93D8' }}>特殊</span>
        </div>
      </div>
    </div>
  );
}
