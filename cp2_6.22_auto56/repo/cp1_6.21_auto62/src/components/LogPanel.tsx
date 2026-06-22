import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface LogPanelProps {
  logs: LogEntry[];
}

const LogPanel: React.FC<LogPanelProps> = ({ logs }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);
  const prevLogCountRef = useRef<number>(0);

  useEffect(() => {
    if (logs.length > prevLogCountRef.current && logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
    prevLogCountRef.current = logs.length;
  }, [logs]);

  const getLogPrefixColor = (type: LogEntry['type']): string => {
    switch (type) {
      case 'move':
        return '#3498db';
      case 'combat':
        return '#e74c3c';
      case 'collect':
        return '#2ecc71';
      case 'event':
        return '#ffb300';
      case 'system':
        return '#9b59b6';
      default:
        return '#f5deb3';
    }
  };

  const getLogPrefix = (type: LogEntry['type']): string => {
    switch (type) {
      case 'move':
        return '移动';
      case 'combat':
        return '战斗';
      case 'collect':
        return '采集';
      case 'event':
        return '事件';
      case 'system':
        return '系统';
      default:
        return '其他';
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

  const displayLogs = logs.slice(0, 12);

  return (
    <div className="log-panel">
      <div className="log-header">
        <h3 className="log-title">行动日志</h3>
        <span className="log-count">{logs.length} 条记录</span>
      </div>
      <div className="log-container" ref={logContainerRef}>
        {displayLogs.map((log, index) => (
          <div
            key={log.id}
            className="log-entry"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <span
              className="log-prefix"
              style={{ backgroundColor: getLogPrefixColor(log.type) }}
            >
              {getLogPrefix(log.type)}
            </span>
            <span className="log-time">{formatTime(log.timestamp)}</span>
            <span className="log-message">{log.message}</span>
          </div>
        ))}
      </div>

      <style>{`
        .log-panel {
          height: 120px;
          background-color: #111;
          border: 2px solid #5d4037;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .log-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 12px;
          background-color: #2c1e16;
          border-bottom: 1px solid #5d4037;
        }

        .log-title {
          font-size: 13px;
          color: #ffb300;
          margin: 0;
        }

        .log-count {
          font-size: 11px;
          color: #a89078;
        }

        .log-container {
          flex: 1;
          overflow-y: auto;
          padding: 4px 8px;
          scroll-behavior: smooth;
        }

        .log-container::-webkit-scrollbar {
          width: 6px;
        }

        .log-container::-webkit-scrollbar-track {
          background: #1a1a1a;
        }

        .log-container::-webkit-scrollbar-thumb {
          background: #5d4037;
          border-radius: 3px;
        }

        .log-entry {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 6px;
          font-size: 12px;
          line-height: 1.4;
          animation: fadeSlide 0.3s ease forwards;
          opacity: 0;
        }

        @keyframes fadeSlide {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .log-prefix {
          display: inline-block;
          padding: 1px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: bold;
          color: #fff;
          flex-shrink: 0;
          text-transform: none;
        }

        .log-time {
          color: #666;
          font-size: 11px;
          flex-shrink: 0;
          font-family: monospace;
        }

        .log-message {
          color: #f5deb3;
          flex: 1;
          word-break: break-all;
        }
      `}</style>
    </div>
  );
};

export default LogPanel;
