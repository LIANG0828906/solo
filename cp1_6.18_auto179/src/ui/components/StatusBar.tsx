import React from 'react';
import { useEditorStore } from '../store';

const StatusBar: React.FC = () => {
  const { users, connectionStatus, lastSavedAt, wordCount } = useEditorStore();

  const formatLastSaved = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getConnectionText = (): string => {
    switch (connectionStatus) {
      case 'connected':
        return '已连接';
      case 'connecting':
        return '连接中...';
      case 'disconnected':
        return '已断开';
      case 'error':
        return '连接错误';
      default:
        return '未知';
    }
  };

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        <div className="status-item">
          <span
            className={`status-dot ${connectionStatus !== 'connected' ? 'disconnected' : ''}`}
          />
          <span>{getConnectionText()}</span>
        </div>
        <div className="status-item">
          <span>在线:</span>
          <div className="status-users">
            {users.slice(0, 5).map((user) => (
              <div
                key={user.id}
                className="status-user-dot"
                style={{ background: user.color }}
                title={user.name}
              />
            ))}
          </div>
          <span style={{ marginLeft: '4px' }}>{users.length} 人</span>
        </div>
      </div>
      <div className="status-bar-left">
        <div className="status-item">
          <span>最后保存: {formatLastSaved(lastSavedAt)}</span>
        </div>
        <div className="status-item">
          <span>{wordCount} 字</span>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
