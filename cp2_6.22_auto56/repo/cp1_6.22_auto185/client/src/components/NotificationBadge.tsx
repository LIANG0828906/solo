import { useState, useRef, useEffect } from 'react';
import type { NotificationItem } from '../utils/types';
import { formatCountdown } from '../utils/timezoneUtils';

interface Props {
  notifications: NotificationItem[];
  onClear: () => void;
  onMarkRead: (id: string) => void;
}

export function NotificationBadge({ notifications, onClear, onMarkRead }: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function formatNotiTime(ts: number) {
    const now = Date.now();
    const diff = Math.floor((now - ts) / 1000);
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    return `${Math.floor(diff / 86400)}天前`;
  }

  return (
    <div className="notification-btn-wrapper" ref={wrapperRef}>
      <button
        className="notification-btn"
        onClick={() => setOpen(o => !o)}
        title="通知"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <span>通知 ({notifications.length})</span>
            {notifications.length > 0 && (
              <span className="clear-btn" onClick={onClear}>
                清空
              </span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="empty-notifications">
              暂无通知
            </div>
          ) : (
            notifications.slice(0, 20).map(n => (
              <div
                key={n.id}
                className={`notification-item ${!n.read ? 'unread' : ''}`}
                onClick={() => {
                  onMarkRead(n.id);
                }}
              >
                <div className={`noti-icon ${n.type === 'created' ? 'created' : 'reminder'}`}>
                  {n.type === 'created' ? '📅' : '⏰'}
                </div>
                <div className="noti-content">
                  <div className="noti-title">
                    {n.type === 'reminder_15' && `15分钟后开始：${n.title}`}
                    {n.type === 'reminder_5' && `5分钟后开始：${n.title}`}
                    {n.type === 'created' && `会议已创建：${n.title}`}
                  </div>
                  <div className="noti-desc">
                    团队：{n.teamName} · {n.startTimeUTC} UTC
                  </div>
                  <div className="noti-time">
                    {formatNotiTime(n.timestamp)} · {formatCountdown(n.minutesUntil)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
