import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { LogEntry } from '../types/game';
import './LogPanel.css';

interface LogPanelProps {
  logs: LogEntry[];
}

const ITEM_HEIGHT = 28;
const VISIBLE_ITEMS = 15;

export const LogPanel: React.FC<LogPanelProps> = ({ logs }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(VISIBLE_ITEMS * ITEM_HEIGHT);

  const totalHeight = logs.length * ITEM_HEIGHT;

  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - 2);
  const endIndex = Math.min(
    logs.length,
    Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + 2,
  );

  const visibleLogs = logs.slice(startIndex, endIndex);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerHeight(entry.contentRect.height);
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'attack':
        return '#e74c3c';
      case 'heal':
        return '#2ecc71';
      case 'shield':
        return '#3498db';
      case 'debuff':
        return '#9b59b6';
      case 'turn':
        return '#f1c40f';
      case 'utility':
        return '#f39c12';
      case 'system':
      default:
        return '#95a5a6';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="log-panel">
      <div className="log-header">
        <span className="log-title">📜 战斗日志</span>
        <span className="log-count">{logs.length} 条</span>
      </div>

      <div
        className="log-container"
        ref={containerRef}
        onScroll={handleScroll}
      >
        <div
          className="log-phantom"
          style={{ height: totalHeight }}
        >
          <div
            className="log-items"
            style={{ transform: `translateY(${startIndex * ITEM_HEIGHT}px)` }}
          >
            {visibleLogs.map((log, index) => (
              <div
                key={log.id}
                className="log-entry"
                style={{
                  height: ITEM_HEIGHT,
                  animationDelay: `${index * 0.02}s`,
                }}
              >
                <span className="log-time">[{formatTime(log.timestamp)}]</span>
                <span
                  className="log-message"
                  style={{ color: getLogColor(log.type) }}
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
