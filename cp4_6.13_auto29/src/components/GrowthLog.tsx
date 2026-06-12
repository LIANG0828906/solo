import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { LogEntry } from '../types';
import './GrowthLog.css';

interface GrowthLogProps {
  logs: LogEntry[];
}

const GrowthLog: React.FC<GrowthLogProps> = ({ logs }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(200);

  const itemHeight = 50;
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 2;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 1);
  const endIndex = Math.min(logs.length, startIndex + visibleCount);

  useEffect(() => {
    if (containerRef.current) {
      setContainerHeight(containerRef.current.clientHeight);
    }
  }, [isExpanded]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const visibleLogs = useMemo(() => {
    return logs.slice(startIndex, endIndex);
  }, [logs, startIndex, endIndex]);

  const totalHeight = logs.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`growth-log ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="log-header" onClick={toggleExpand}>
        <h3 className="log-title">
          <span className="log-icon">📜</span>
          成长日志
          <span className="log-count">({logs.length})</span>
        </h3>
        <span className={`toggle-arrow ${isExpanded ? 'up' : 'down'}`}>▼</span>
      </div>

      {isExpanded && (
        <div
          className="log-container"
          ref={containerRef}
          onScroll={handleScroll}
        >
          {logs.length === 0 ? (
            <div className="empty-log">暂无孵化记录，开始你的第一次孵化吧！</div>
          ) : (
            <div
              className="log-list"
              style={{ height: totalHeight, position: 'relative' }}
            >
              <div style={{ transform: `translateY(${offsetY}px)` }}>
                {visibleLogs.map((log, index) => (
                  <div
                    key={log.id}
                    className="log-item"
                    style={{
                      height: itemHeight,
                      animationDelay: `${(startIndex + index) * 0.05}s`,
                    }}
                  >
                    <span className="log-time">{log.time}</span>
                    <span className="log-message">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GrowthLog;
