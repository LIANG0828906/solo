import { useGardenStore } from '../GardenStore';
import { LogEntry } from '../GardenStore';
import './CareLog.css';

const CareLog = () => {
  const logs = useGardenStore((state) => state.logs);
  const logExpanded = useGardenStore((state) => state.logExpanded);
  const toggleLogExpanded = useGardenStore((state) => state.toggleLogExpanded);
  const clearLogs = useGardenStore((state) => state.clearLogs);
  const exportLogs = useGardenStore((state) => state.exportLogs);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'water':
        return '💧';
      case 'light':
        return '☀️';
      case 'nutrients':
        return '🌱';
      case 'plant':
        return '🌰';
      case 'remove':
        return '🗑️';
      case 'tag':
        return '🏷️';
      case 'time':
        return '⏳';
      default:
        return '📝';
    }
  };

  return (
    <div className={`care-log ${logExpanded ? 'expanded' : ''}`}>
      <button className="log-toggle" onClick={toggleLogExpanded}>
        <span className="log-icon">📔</span>
        <span className="log-title">养护日志</span>
        <span className={`log-arrow ${logExpanded ? 'down' : ''}`}>▲</span>
      </button>

      {logExpanded && (
        <div className="log-panel">
          <div className="log-actions">
            <button className="log-action-btn" onClick={exportLogs}>
              📤 导出
            </button>
            <button className="log-action-btn danger" onClick={clearLogs}>
              🗑️ 清空
            </button>
          </div>

          <div className="log-list">
            {logs.length === 0 ? (
              <div className="empty-log">还没有养护记录</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="log-entry">
                  <span className="log-entry-icon">{getLogIcon(log.type)}</span>
                  <div className="log-entry-content">
                    <span className="log-entry-message">{log.message}</span>
                    <span className="log-entry-time">{formatTime(log.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {logs.length > 0 && (
            <div className="log-footer">
              共 {logs.length} 条记录
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CareLog;
