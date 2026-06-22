import { useState } from 'react';
import type { Log, Route } from '../types';
import { api } from '../utils/api';

interface RoutePlannerProps {
  logs: Log[];
  selectedLogIds: string[];
  onToggleLog: (logId: string) => void;
  onClearSelection: () => void;
  onRouteCreated: (route: Route) => void;
}

export default function RoutePlanner({
  logs,
  selectedLogIds,
  onToggleLog,
  onClearSelection,
  onRouteCreated,
}: RoutePlannerProps) {
  const [routeName, setRouteName] = useState('我的旅行路线');
  const [showToast, setShowToast] = useState(false);

  const handleShare = async () => {
    if (selectedLogIds.length < 2) return;
    try {
      const route = await api.createRoute({
        name: routeName,
        logIds: selectedLogIds,
      });
      onRouteCreated(route);
      const shareUrl = `${window.location.origin}${window.location.pathname}#/routes/${route.id}`;
      await navigator.clipboard.writeText(shareUrl);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (err) {
      console.error('Failed to create route:', err);
    }
  };

  const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <>
      <div className="sidebar-header">
        <span>🗺️</span>
        <span className="sidebar-title">路线规划</span>
      </div>

      <div className="sidebar-list">
        {sortedLogs.length === 0 ? (
          <div className="empty-state" style={{ height: '200px', padding: '20px' }}>
            <div className="empty-state-icon">📍</div>
            <div className="empty-state-text">还没有旅行日志<br/>点击地图创建第一个吧</div>
          </div>
        ) : (
          sortedLogs.map(log => (
            <div
              key={log.id}
              className={`log-item ${selectedLogIds.includes(log.id) ? 'selected' : ''}`}
              onClick={() => onToggleLog(log.id)}
            >
              <input
                type="checkbox"
                className="log-checkbox"
                checked={selectedLogIds.includes(log.id)}
                onChange={e => {
                  e.stopPropagation();
                  onToggleLog(log.id);
                }}
                onClick={e => e.stopPropagation()}
              />
              <div className="log-thumb">
                {log.photos[0] ? (
                  <img src={log.photos[0]} alt="" loading="lazy" />
                ) : (
                  '📍'
                )}
              </div>
              <div className="log-info">
                <div className="log-name">{log.name}</div>
                <div className="log-date">{log.date}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="route-planner-footer">
        <div className="form-group">
          <label className="form-label">路线名称</label>
          <input
            type="text"
            className="form-input"
            value={routeName}
            onChange={e => setRouteName(e.target.value)}
            placeholder="给路线起个名字"
          />
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(62, 39, 35, 0.6)' }}>
          已选 {selectedLogIds.length} 个途经点
          {selectedLogIds.length < 2 && '（至少选择2个）'}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={onClearSelection}
            disabled={selectedLogIds.length === 0}
            style={{ flex: 1 }}
          >
            清空
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleShare}
            disabled={selectedLogIds.length < 2}
            style={{ flex: 2 }}
          >
            🔗 生成分享链接
          </button>
        </div>
      </div>

      {showToast && <div className="copy-toast">✓ 链接已复制到剪贴板</div>}
    </>
  );
}
