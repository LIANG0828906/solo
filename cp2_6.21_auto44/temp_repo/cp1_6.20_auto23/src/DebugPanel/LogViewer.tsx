import React, { useState } from 'react';
import { LogEntry } from '../PreviewEngine/types';

interface LogViewerProps {
  logs: LogEntry[];
  onClear: () => void;
}

const LogViewer: React.FC<LogViewerProps> = ({ logs, onClear }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const handleLogClick = async (log: LogEntry) => {
    try {
      await navigator.clipboard.writeText(log.message);
      setCopiedId(log.id);
      setTimeout(() => setCopiedId(null), 300);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const getLevelColor = (level: 'info' | 'warn' | 'error'): string => {
    switch (level) {
      case 'info':
        return '#95a5a6';
      case 'warn':
        return '#f39c12';
      case 'error':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  const getLevelText = (level: 'info' | 'warn' | 'error'): string => {
    switch (level) {
      case 'info':
        return '信息';
      case 'warn':
        return '警告';
      case 'error':
        return '错误';
      default:
        return level;
    }
  };

  const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="log-viewer">
      <div className="log-header">
        <span className="log-title">日志面板</span>
        <span className="log-count">{logs.length} 条</span>
        <button className="clear-btn" onClick={onClear} disabled={logs.length === 0}>
          清空
        </button>
      </div>
      <div className="log-list">
        {sortedLogs.length === 0 ? (
          <div className="log-empty">暂无日志</div>
        ) : (
          sortedLogs.map(log => (
            <div
              key={log.id}
              className={`log-item log-${log.level}`}
              onClick={() => handleLogClick(log)}
            >
              <span
                className="log-dot"
                style={{ backgroundColor: getLevelColor(log.level) }}
              />
              <span className="log-time">{formatTime(log.timestamp)}</span>
              <span className="log-level">[{getLevelText(log.level)}]</span>
              <span className="log-message">{log.message}</span>
              {copiedId === log.id && (
                <span className="copy-toast">已复制</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LogViewer;
