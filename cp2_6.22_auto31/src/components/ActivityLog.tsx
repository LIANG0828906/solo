import { ActivityLog as ActivityLogType } from '../types';
import './components.css';

interface ActivityLogProps {
  logs: ActivityLogType[];
}

const formatRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return date.toLocaleDateString('zh-CN');
};

export default function ActivityLog({ logs }: ActivityLogProps) {
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="activity-log-card">
      <h3 className="activity-log-title">操作日志</h3>

      <div className="activity-log-list">
        {sortedLogs.map((log) => (
          <div key={log.id} className="log-item">
            <div className="log-content">
              <span className="log-user">{log.userName}</span>
              <span className="log-action">
                {' '}{log.action}
                {log.taskTitle && <span className="log-task"> "{log.taskTitle}"</span>}
              </span>
            </div>
            <div className="log-time">{formatRelativeTime(log.timestamp)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
