import { TransportUpdate, TransportStatus, TransportStatusLabels } from './types';
import { useRef, useEffect } from 'react';

interface StatusSidebarProps {
  updates: TransportUpdate[];
}

function StatusSidebar({ updates }: StatusSidebarProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(updates.length);

  useEffect(() => {
    if (updates.length > prevCountRef.current && listRef.current) {
      listRef.current.scrollTop = 0;
    }
    prevCountRef.current = updates.length;
  }, [updates.length]);

  const getStatusColor = (status: TransportStatus): string => {
    switch (status) {
      case TransportStatus.OUT_FOR_DELIVERY:
        return '#F0AD4E';
      case TransportStatus.IN_TRANSIT:
        return '#5BC0DE';
      case TransportStatus.ARRIVED:
        return '#5CB85C';
      default:
        return '#999999';
    }
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <aside className="status-sidebar">
      <div className="sidebar-header">
        <h3>运输动态</h3>
        <span className="update-count">{updates.length}</span>
      </div>
      <div className="status-list" ref={listRef}>
        {updates.length === 0 ? (
          <div className="status-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <p>暂无状态更新</p>
          </div>
        ) : (
          updates.map((update, index) => (
            <div
              key={`${update.artworkId}-${update.timestamp}`}
              className={`status-item ${index === 0 ? 'new' : ''}`}
              style={{ '--status-color': getStatusColor(update.newStatus) } as React.CSSProperties}
            >
              <div className="status-bar" style={{ backgroundColor: getStatusColor(update.newStatus) }} />
              <div className="status-content">
                <div className="status-item-name" title={update.artworkName}>
                  {update.artworkName}
                </div>
                <div className="status-item-label">
                  → {TransportStatusLabels[update.newStatus]}
                </div>
              </div>
              <div className="status-time">{formatTime(update.timestamp)}</div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

export default StatusSidebar;
