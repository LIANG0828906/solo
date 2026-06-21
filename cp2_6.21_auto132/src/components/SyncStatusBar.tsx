import useProjectStore from '../store/useProjectStore';

export default function SyncStatusBar() {
  const { wsStatus, lastSyncTime, reconnectSocket } = useProjectStore();

  const dotColor =
    wsStatus === 'connected'
      ? '#00e676'
      : wsStatus === 'reconnecting'
      ? '#ffa726'
      : '#ff5252';

  const statusText =
    wsStatus === 'connected'
      ? '已连接'
      : wsStatus === 'reconnecting'
      ? '重连中...'
      : '已断开';

  const formatTime = () => {
    if (!lastSyncTime) return '尚未同步';
    const diff = Math.floor((Date.now() - lastSyncTime) / 1000);
    if (diff < 5) return '刚刚';
    if (diff < 60) return `${diff}秒前`;
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    return `${Math.floor(diff / 3600)}小时前`;
  };

  return (
    <div className="sync-status-bar" onClick={reconnectSocket}>
      <span className="sync-dot" style={{ background: dotColor }} />
      <span className="sync-text">{statusText}</span>
      <span className="sync-divider">|</span>
      <span className="sync-time">最后同步：{formatTime()}</span>
      {wsStatus !== 'connected' && (
        <button className="sync-reconnect-btn">点击重连</button>
      )}
    </div>
  );
}
