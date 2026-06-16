import { useEffect, useRef, useState } from 'react';
import { useGameStore } from './gameStore';
import { MAX_COMBAT_LOGS } from './types';

export default function LogPanel() {
  const { combatLogs } = useGameStore();
  const logRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<boolean>(true);
  const lastLogCountRef = useRef<number>(0);
  const [, forceUpdate] = useState(0);

  const isAtBottom = (): boolean => {
    const el = logRef.current;
    if (!el) return true;
    const threshold = 8;
    return (
      el.scrollHeight - el.scrollTop - el.clientHeight <= threshold
    );
  };

  const scrollToBottom = (smooth: boolean = false) => {
    const el = logRef.current;
    if (!el) return;
    if (smooth) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: 'smooth',
      });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  };

  useEffect(() => {
    if (!logRef.current) return;

    const handleScroll = () => {
      const wasAutoScroll = autoScrollRef.current;
      autoScrollRef.current = isAtBottom();

      if (wasAutoScroll !== autoScrollRef.current) {
        forceUpdate((n) => n + 1);
      }
    };

    const el = logRef.current;
    el.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      el.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const newLogCount = combatLogs.length;
    const hasNewLogs = newLogCount > lastLogCountRef.current;

    if (hasNewLogs && autoScrollRef.current) {
      requestAnimationFrame(() => {
        scrollToBottom(true);
      });
    }

    lastLogCountRef.current = newLogCount;
  }, [combatLogs]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (autoScrollRef.current) {
        scrollToBottom(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'damage':
        return '💥';
      case 'skill':
        return '✨';
      case 'move':
        return '👣';
      default:
        return '📢';
    }
  };

  const handleJumpToBottom = () => {
    autoScrollRef.current = true;
    scrollToBottom(true);
    forceUpdate((n) => n + 1);
  };

  const displayLogs = combatLogs.slice(-MAX_COMBAT_LOGS);

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
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          paddingBottom: 8,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: '#1ABC9C',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>📜</span>
          <span>战斗日志</span>
        </div>
        <div
          style={{
            fontSize: 10,
            color: '#7F8C8D',
            backgroundColor: 'rgba(0,0,0,0.2)',
            padding: '2px 6px',
            borderRadius: 4,
          }}
        >
          {combatLogs.length}/{MAX_COMBAT_LOGS}
        </div>
      </div>

      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <div
          ref={logRef}
          style={{
            position: 'absolute',
            inset: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            scrollbarWidth: 'thin',
            scrollbarColor: '#1ABC9C #2C3E50',
            paddingRight: 4,
          }}
        >
          {displayLogs.length === 0 ? (
            <div
              style={{
                color: '#7F8C8D',
                fontSize: 12,
                textAlign: 'center',
                padding: 20,
                fontStyle: 'italic',
              }}
            >
              暂无战斗记录...
            </div>
          ) : (
            displayLogs.map((log, index) => (
              <div
                key={log.id}
                data-index={index}
                style={{
                  minHeight: 28,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 6px',
                  borderRadius: 4,
                  cursor: 'default',
                  transition: 'all 0.15s ease',
                  backgroundColor:
                    index === displayLogs.length - 1
                      ? 'rgba(26,188,156,0.08)'
                      : 'transparent',
                  borderLeft: `2px solid ${getTypeColor(log.type)}40`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    'rgba(255,255,255,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    index === displayLogs.length - 1
                      ? 'rgba(26,188,156,0.08)'
                      : 'transparent';
                }}
              >
                <span style={{ fontSize: 12, flexShrink: 0 }}>
                  {getTypeIcon(log.type)}
                </span>
                <span
                  style={{
                    color: '#7F8C8D',
                    fontSize: 10,
                    minWidth: 52,
                    flexShrink: 0,
                    fontFamily: 'monospace',
                  }}
                >
                  {formatTime(log.timestamp)}
                </span>
                <span
                  style={{
                    color: getTypeColor(log.type),
                    wordBreak: 'break-word',
                    lineHeight: 1.3,
                    fontWeight: 500,
                  }}
                >
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>

        {!autoScrollRef.current && combatLogs.length > 0 && (
          <button
            onClick={handleJumpToBottom}
            style={{
              position: 'absolute',
              bottom: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#1ABC9C',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 16,
              padding: '6px 14px',
              fontSize: 11,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              boxShadow: '0 2px 8px rgba(26,188,156,0.4)',
              transition: 'all 0.2s ease',
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
              e.currentTarget.style.backgroundColor = '#16A085';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
              e.currentTarget.style.backgroundColor = '#1ABC9C';
            }}
          >
            <span>⬇️</span>
            <span>查看最新</span>
          </button>
        )}
      </div>

      <div
        style={{
          marginTop: 10,
          paddingTop: 8,
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 10,
          color: '#7F8C8D',
        }}
      >
        <span>{autoScrollRef.current ? '🔄 自动滚动' : '⏸ 已暂停'}</span>
        <span>最多 {MAX_COMBAT_LOGS} 条</span>
      </div>
    </div>
  );
}
