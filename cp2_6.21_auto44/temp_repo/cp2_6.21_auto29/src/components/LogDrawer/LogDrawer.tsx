import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useBoardStore } from '../../store/boardStore';
import type { LogEntry } from '../../types';

interface LogDrawerProps {
  open: boolean;
  onToggle: () => void;
}

const ITEM_HEIGHT = 60;
const BUFFER = 5;

function LogDrawer({ open, onToggle }: LogDrawerProps) {
  const logs = useBoardStore((s) => s.logs);
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(400);

  useEffect(() => {
    const updateHeight = () => {
      if (listRef.current) {
        setViewportHeight(listRef.current.clientHeight || 400);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [open]);

  const handleScroll = useCallback(() => {
    if (listRef.current) {
      setScrollTop(listRef.current.scrollTop);
    }
  }, []);

  const sortedLogs = useMemo(() => {
    return [...logs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [logs]);

  const totalHeight = sortedLogs.length * ITEM_HEIGHT;
  const startIdx = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER);
  const visibleCount = Math.ceil(viewportHeight / ITEM_HEIGHT) + BUFFER * 2;
  const endIdx = Math.min(sortedLogs.length, startIdx + visibleCount);
  const visibleLogs = sortedLogs.slice(startIdx, endIdx);
  const offsetY = startIdx * ITEM_HEIGHT;

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return '刚刚';
      if (minutes < 60) return `${minutes} 分钟前`;
      if (hours < 24) return `${hours} 小时前`;
      if (days < 7) return `${days} 天前`;
      return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return ts;
    }
  };

  const actionLabel = (type: string) => {
    switch (type) {
      case 'create':
        return '创建';
      case 'update':
        return '更新';
      case 'move':
        return '移动';
      case 'delete':
        return '删除';
      default:
        return type;
    }
  };

  const actionIcon = (type: string) => {
    switch (type) {
      case 'create':
        return '+';
      case 'update':
        return '✎';
      case 'move':
        return '→';
      case 'delete':
        return '×';
      default:
        return '•';
    }
  };

  return (
    <>
      <button
        className={`log-drawer-toggle ${open ? 'open' : ''}`}
        onClick={onToggle}
        title={open ? '关闭日志' : '查看操作日志'}
      >
        {open ? '×' : '⏱'}
      </button>

      <div className={`log-drawer ${open ? 'open' : ''}`}>
        <div className="log-drawer-header">
          <div className="log-drawer-title">操作日志</div>
          <button
            className="log-drawer-close"
            onClick={onToggle}
            title="关闭"
          >
            ×
          </button>
        </div>

        <div
          ref={listRef}
          className="log-list"
          onScroll={handleScroll}
        >
          {sortedLogs.length === 0 ? (
            <div className="empty-state">暂无操作日志</div>
          ) : (
            <div style={{ height: totalHeight, position: 'relative' }}>
              <div style={{ transform: `translateY(${offsetY}px)` }}>
                {visibleLogs.map((log: LogEntry) => (
                  <div
                    key={log.id}
                    className="log-item"
                    style={{ height: ITEM_HEIGHT, boxSizing: 'border-box' }}
                  >
                    <div className={`log-icon ${log.action_type}`}>
                      {actionIcon(log.action_type)}
                    </div>
                    <div className="log-content">
                      <div className="log-message">
                        <strong>{log.operator}</strong> {actionLabel(log.action_type)}了 {log.details || '任务'}
                      </div>
                      <div className="log-time">{formatTime(log.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default LogDrawer;
