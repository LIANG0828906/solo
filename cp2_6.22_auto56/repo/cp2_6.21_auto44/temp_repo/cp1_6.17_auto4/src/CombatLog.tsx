import { useState, useRef, useEffect, useMemo } from 'react';
import { useCombatStore, LogType } from './store';

const LOG_COLORS: Record<LogType, string> = {
  attack: '#FF5252',
  defense: '#69F0AE',
  special: '#CE93D8',
};

const FADE_OUT_LAST_COUNT = 5;
const VISIBLE_COUNT = 20;
const ITEM_HEIGHT = 48;

function LogIcon({ type, size = 16 }: { type: LogType; size?: number }) {
  const color = LOG_COLORS[type];

  if (type === 'attack') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, display: 'block' }}>
        <path
          d="M6.5 17.5L14 10M14 10L11.5 4L20 8.5L16 7L14 10ZM14 10L9.5 14.5M10 17L7 20L4 17L7 14L10 17Z"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={color + '22'}
        />
        <circle cx="20" cy="8.5" r="2" fill={color + '88'} />
      </svg>
    );
  }

  if (type === 'defense') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, display: 'block' }}>
        <path
          d="M12 3L4 6V12C4 16.5 7.5 20.5 12 22C16.5 20.5 20 16.5 20 12V6L12 3Z"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={color + '22'}
        />
        <path
          d="M9 12L11 14L15 10"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, display: 'block' }}>
      <path
        d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={color + '33'}
      />
      <circle cx="12" cy="12" r="2" fill={color} />
    </svg>
  );
}

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

  const getOpacity = (index: number): number => {
    const fadeStartIndex = logs.length - FADE_OUT_LAST_COUNT;
    if (index < fadeStartIndex) return 1;
    const fadeProgress = (index - fadeStartIndex + 1) / FADE_OUT_LAST_COUNT;
    return 1 - fadeProgress * 0.8;
  };

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
        }}
        className="combat-log-scroll"
      >
        <style>{`
          .combat-log-scroll::-webkit-scrollbar {
            width: 6px;
          }
          .combat-log-scroll::-webkit-scrollbar-track {
            background: #333;
            border-radius: 3px;
          }
          .combat-log-scroll::-webkit-scrollbar-thumb {
            background: #666;
            border-radius: 3px;
            transition: background-color 0.2s ease;
          }
          .combat-log-scroll::-webkit-scrollbar-thumb:hover {
            background: #888;
          }
          .combat-log-scroll {
            scrollbar-width: thin;
            scrollbar-color: #666 #333;
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
                const opacity = getOpacity(log.index);
                return (
                  <div
                    key={log.id}
                    style={{
                      height: ITEM_HEIGHT,
                      padding: '8px 12px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      opacity,
                      transition: 'opacity 0.3s ease',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px', flexShrink: 0 }}>
                      <LogIcon type={log.type} size={14} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, marginLeft: '4px' }}>
                      <div
                        style={{
                          color: LOG_COLORS[log.type],
                          fontSize: '11px',
                          fontFamily: "'JetBrains Mono', monospace",
                          marginBottom: '2px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span style={{ opacity: 0.7 }}>回合</span>
                        <span>{log.round}</span>
                        <span style={{ marginLeft: '4px', fontSize: '10px', opacity: 0.6 }}>
                          {log.type === 'attack' ? '· 攻击' : log.type === 'defense' ? '· 防御' : '· 特殊'}
                        </span>
                      </div>
                      <div
                        style={{
                          color: '#E0E0E0',
                          fontSize: '12px',
                          lineHeight: '1.35',
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
          gap: '14px',
          fontSize: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <LogIcon type="attack" size={12} />
          <span style={{ color: '#FF5252' }}>攻击</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <LogIcon type="defense" size={12} />
          <span style={{ color: '#69F0AE' }}>防御</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <LogIcon type="special" size={12} />
          <span style={{ color: '#CE93D8' }}>特殊</span>
        </div>
      </div>
    </div>
  );
}
