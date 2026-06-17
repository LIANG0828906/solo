import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useFightStore, LogEntry, LogType } from './store';

const LOG_COLORS: Record<LogType, string> = {
  attack: '#FF5252',
  defense: '#69F0AE',
  special: '#CE93D8',
  system: '#E0E0E0',
  normal: '#BDBDBD',
  critical: '#FFD700',
};

const ENTRY_HEIGHT = 32;
const BUFFER_COUNT = 5;
const VISIBLE_COUNT = 20;

const keyframesStyle = `
@keyframes logSlideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
`;

const scrollbarStyle = `
.combat-log-scroll::-webkit-scrollbar {
  width: 4px;
}
.combat-log-scroll::-webkit-scrollbar-track {
  background: #333;
}
.combat-log-scroll::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 2px;
}
.combat-log-scroll::-webkit-scrollbar-thumb:hover {
  background: #888;
}
`;

const CombatLog: React.FC = () => {
  const logs = useFightStore((s) => s.logs);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [prevFirstId, setPrevFirstId] = useState<string | null>(null);
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    if (logs.length === 0) return;
    const currentFirstId = logs[0].id;
    if (prevFirstId !== null && prevFirstId !== currentFirstId) {
      setAnimatingId(currentFirstId);
      const timer = setTimeout(() => setAnimatingId(null), 300);
      return () => clearTimeout(timer);
    }
    setPrevFirstId(currentFirstId);
  }, [logs, prevFirstId]);

  useEffect(() => {
    setPrevFirstId(logs.length > 0 ? logs[0].id : null);
  }, []);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      setScrollTop(scrollRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(el);
    setContainerHeight(el.clientHeight);
    return () => observer.disconnect();
  }, []);

  const visibleLogs = useMemo(() => {
    if (logs.length === 0) return [];
    const startIndex = Math.floor(scrollTop / ENTRY_HEIGHT);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / ENTRY_HEIGHT) + BUFFER_COUNT,
      logs.length
    );
    const clampedStart = Math.max(0, startIndex - BUFFER_COUNT);
    return logs.slice(clampedStart, endIndex).map((log, i) => ({
      ...log,
      virtualIndex: clampedStart + i,
    }));
  }, [logs, scrollTop, containerHeight]);

  const getEntryOpacity = useCallback(
    (virtualIndex: number) => {
      if (containerHeight === 0) return 1;
      const entryTop = virtualIndex * ENTRY_HEIGHT - scrollTop;
      const fadeZone = containerHeight * 0.25;
      const fadeStart = containerHeight - fadeZone;
      if (entryTop >= fadeStart) {
        const progress = (entryTop - fadeStart) / fadeZone;
        return Math.max(0.15, 1 - progress * 0.85);
      }
      return 1;
    },
    [scrollTop, containerHeight]
  );

  return (
    <>
      <style>{keyframesStyle}</style>
      <style>{scrollbarStyle}</style>
      <div
        style={{
          width: 280,
          background: 'rgba(37, 37, 37, 0.92)',
          backdropFilter: 'blur(8px)',
          borderLeft: '1px solid #333',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            padding: '16px 16px 8px',
            borderBottom: '1px solid #333',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: '#69F0AE',
                boxShadow: '0 0 6px #69F0AE',
              }}
            />
            <span
              style={{
                color: '#E0E0E0',
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: 1,
              }}
            >
              战斗日志
            </span>
          </div>
          <div
            style={{
              height: 1,
              background:
                'linear-gradient(90deg, #69F0AE 0%, transparent 100%)',
              opacity: 0.3,
            }}
          />
        </div>

        <div
          ref={scrollRef}
          className="combat-log-scroll"
          onScroll={handleScroll}
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            position: 'relative',
            padding: '8px 0',
          }}
        >
          {logs.length === 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#666',
                fontSize: 13,
                minHeight: 100,
              }}
            >
              等待战斗开始...
            </div>
          ) : (
            <div
              style={{
                position: 'relative',
                height: logs.length * ENTRY_HEIGHT,
              }}
            >
              {visibleLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    position: 'absolute',
                    top: log.virtualIndex * ENTRY_HEIGHT,
                    left: 0,
                    right: 0,
                    height: ENTRY_HEIGHT,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 14px',
                    gap: 6,
                    opacity: getEntryOpacity(log.virtualIndex),
                    animation:
                      animatingId === log.id
                        ? 'logSlideIn 0.3s ease-out'
                        : undefined,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: LOG_COLORS[log.type],
                      boxShadow: `0 0 4px ${LOG_COLORS[log.type]}44`,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      color: '#E0E0E0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    <span style={{ color: '#888' }}>[{log.round}]</span>{' '}
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 60,
            background: 'linear-gradient(to bottom, transparent, #252525)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </>
  );
};

export default CombatLog;
