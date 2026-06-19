import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotificationStore } from './UserManager';
import { useAuthStore } from './UserManager';
import { formatDateTime } from '../../shared/utils';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentUser = useAuthStore((state) => state.currentUser);
  const notifications = useNotificationStore((state) => state.notifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);

  const userNotifications = notifications.filter(
    (n) => n.userId === currentUser?.id || (currentUser?.role === 'admin' && n.userId === 'admin-001')
  );

  const unreadCount = userNotifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!currentUser) return null;

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        className="notification-icon-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          {userNotifications.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#999' }}>
              暂无通知
            </div>
          ) : (
            userNotifications.slice(0, 10).map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${notification.read ? '' : 'unread'}`}
                onClick={() => markAsRead(notification.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">
                      {formatDateTime(notification.createdAt)}
                    </div>
                  </div>
                  {!notification.read && (
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'var(--color-brown)',
                      marginLeft: 8,
                      marginTop: 6,
                    }} />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
