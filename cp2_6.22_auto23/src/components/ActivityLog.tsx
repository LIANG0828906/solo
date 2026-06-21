import React from 'react';
import { LogEntry } from '../types';

interface ActivityLogProps {
  logs: LogEntry[];
}

const ActivityLog: React.FC<ActivityLogProps> = ({ logs }) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) {
      return '刚刚';
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)} 分钟前`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)} 小时前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="panel-section">
      <h3 className="panel-title">操作日志</h3>
      <ul className="log-list">
        {logs.length === 0 ? (
          <li className="log-item" style={{ color: '#bdc3c7', textAlign: 'center', padding: '16px 0' }}>
            暂无操作记录
          </li>
        ) : (
          logs.slice(0, 20).map((log) => (
            <li key={log.id} className="log-item">
              <div>
                <strong>{log.userName}</strong> {log.action}
                {log.taskTitle && (
                  <>
                    「<strong>{log.taskTitle}</strong>」
                  </>
                )}
              </div>
              <div className="log-time">{formatTime(log.timestamp)}</div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default ActivityLog;
