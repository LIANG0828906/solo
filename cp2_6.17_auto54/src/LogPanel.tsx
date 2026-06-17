import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from './gameStore';
import { MAX_COMBAT_LOGS } from './types';

interface LogTypeConfig {
  color: string;
  bgColor: string;
  icon: string;
  label: string;
}

const LOG_TYPE_CONFIGS: Record<string, LogTypeConfig> = {
  info: {
    color: '#BDC3C7',
    bgColor: 'rgba(189, 195, 199, 0.15)',
    icon: '📢',
    label: '系统',
  },
  move: {
    color: '#2ECC71',
    bgColor: 'rgba(46, 204, 113, 0.15)',
    icon: '👣',
    label: '移动',
  },
  attack: {
    color: '#E74C3C',
    bgColor: 'rgba(231, 76, 60, 0.15)',
    icon: '⚔️',
    label: '攻击',
  },
  skill: {
    color: '#3498DB',
    bgColor: 'rgba(52, 152, 219, 0.15)',
    icon: '✨',
    label: '技能',
  },
  damage: {
    color: '#F39C12',
    bgColor: 'rgba(243, 156, 18, 0.15)',
    icon: '💥',
    label: '受击',
  },
  defeat: {
    color: '#F1C40F',
    bgColor: 'rgba(241, 196, 15, 0.2)',
    icon: '🏆',
    label: '击败',
  },
};

const getTypeConfig = (type: string): LogTypeConfig => {
  return LOG_TYPE_CONFIGS[type] || LOG_TYPE_CONFIGS.info;
};

const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 3) {
    return '刚刚';
  } else if (seconds < 60) {
    return `${seconds}秒前`;
  } else if (minutes < 60) {
    if (minutes === 1) {
      return '1分钟前';
    }
    return `${minutes}分钟前`;
  } else if (hours < 24) {
    const date = new Date(timestamp);
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  } else {
    const date = new Date(timestamp);
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }
};

const formatExactTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

export default function LogPanel() {
  const { combatLogs } = useGameStore();
  const logRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<boolean>(true);
  const lastLogCountRef = useRef<number>(0);
  const userScrolledRef = useRef<boolean>(false);
  const [, forceUpdate] = useState(0);
  const [timeTick, setTimeTick] = useState(0);

  const isAtBottom = useCallback((): boolean => {
    const el = logRef.current;
    if (!el) return true;
    const threshold = 10;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distance <= threshold;
  }, []);

  const scrollToBottom = useCallback((smooth: boolean = false) => {
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
  }, []);

  useEffect(() => {
    const el = logRef.current;
    if (!el) return;

    const handleScroll = () => {
      const atBottom = isAtBottom();
      const wasAutoScroll = autoScrollRef.current;

      if (userScrolledRef.current && !atBottom) {
        autoScrollRef.current = false;
      }

      if (atBottom && !wasAutoScroll) {
        autoScrollRef.current = true;
        userScrolledRef.current = false;
      }

      if (wasAutoScroll !== autoScrollRef.current) {
        forceUpdate((n) => n + 1);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY < 0 || e.deltaX !== 0) {
        userScrolledRef.current = true;
        autoScrollRef.current = false;
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    el.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      el.removeEventListener('scroll', handleScroll);
      el.removeEventListener('wheel', handleWheel);
    };
  }, [isAtBottom]);

  useEffect(() => {
    const newLogCount = combatLogs.length;
    const hasNewLogs = newLogCount > lastLogCountRef.current;

    if (hasNewLogs) {
      if (autoScrollRef.current) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            scrollToBottom(true);
          });
        });
      }
    }

    lastLogCountRef.current = newLogCount;
  }, [combatLogs, scrollToBottom]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (autoScrollRef.current) {
        scrollToBottom(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [scrollToBottom]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeTick((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleJumpToBottom = () => {
    autoScrollRef.current = true;
    userScrolledRef.current = false;
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
          paddingBottom: 10,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 'bold',
            color: '#1ABC9C',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ fontSize: 18 }}>📜</span>
          <span>战斗日志</span>
        </div>
        <div
          style={{
            fontSize: 10,
            color: '#7F8C8D',
            backgroundColor: 'rgba(0,0,0,0.2)',
            padding: '3px 8px',
            borderRadius: 10,
            fontWeight: 500,
          }}
        >
          {combatLogs.length} / {MAX_COMBAT_LOGS}
        </div>
      </div>

      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <div
          ref={logRef}
          data-tick={timeTick}
          style={{
            position: 'absolute',
            inset: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            scrollbarWidth: 'thin',
            scrollbarColor: '#1ABC9C #2C3E50',
            paddingRight: 6,
            paddingBottom: 4,
          }}
        >
          {displayLogs.length === 0 ? (
            <div
              style={{
                color: '#7F8C8D',
                fontSize: 12,
                textAlign: 'center',
                padding: 30,
                fontStyle: 'italic',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 24 }}>⏳</span>
              <span>暂无战斗记录...</span>
            </div>
          ) : (
            displayLogs.map((log, index) => {
              const config = getTypeConfig(log.type);
              const isNewest = index === displayLogs.length - 1;
              const relativeTime = formatRelativeTime(log.timestamp);
              const exactTime = formatExactTime(log.timestamp);

              return (
                <div
                  key={log.id}
                  title={exactTime}
                  style={{
                    minHeight: 30,
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '6px 8px',
                    borderRadius: 6,
                    cursor: 'default',
                    transition: 'all 0.15s ease',
                    backgroundColor: isNewest
                      ? 'rgba(26, 188, 156, 0.08)'
                      : 'transparent',
                    borderLeft: `3px solid ${config.color}`,
                    position: 'relative',
                    lineHeight: 1.4,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      'rgba(255,255,255,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isNewest
                      ? 'rgba(26, 188, 156, 0.08)'
                      : 'transparent';
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: config.color,
                      flexShrink: 0,
                      marginTop: 6,
                      boxShadow: `0 0 6px ${config.color}60`,
                    }}
                  />

                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    <span
                      style={{
                        color: config.color,
                        wordBreak: 'break-word',
                        fontWeight: 500,
                      }}
                    >
                      {log.message}
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 10,
                        color: '#7F8C8D',
                      }}
                    >
                      <span
                        style={{
                          padding: '1px 5px',
                          borderRadius: 3,
                          backgroundColor: config.bgColor,
                          color: config.color,
                          fontSize: 9,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}
                      >
                        {config.label}
                      </span>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 10,
                          opacity: 0.8,
                        }}
                      >
                        {relativeTime}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {!autoScrollRef.current && combatLogs.length > 0 && (
          <button
            onClick={handleJumpToBottom}
            style={{
              position: 'absolute',
              bottom: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#1ABC9C',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 20,
              padding: '8px 16px',
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 12px rgba(26,188,156,0.4)',
              transition: 'all 0.2s ease',
              zIndex: 10,
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateX(-50%) translateY(-1px)';
              e.currentTarget.style.backgroundColor = '#16A085';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(26,188,156,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(-50%) translateY(0)';
              e.currentTarget.style.backgroundColor = '#1ABC9C';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(26,188,156,0.4)';
            }}
          >
            <span>⬇️</span>
            <span>查看最新</span>
          </button>
        )}
      </div>

      <div
        style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 10,
          color: '#7F8C8D',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: autoScrollRef.current ? '#2ECC71' : '#E74C3C',
              boxShadow: autoScrollRef.current
                ? '0 0 4px rgba(46,204,113,0.6)'
                : 'none',
            }}
          />
          {autoScrollRef.current ? '自动滚动' : '已暂停'}
        </span>
        <span>保留最近 {MAX_COMBAT_LOGS} 条</span>
      </div>
    </div>
  );
}
