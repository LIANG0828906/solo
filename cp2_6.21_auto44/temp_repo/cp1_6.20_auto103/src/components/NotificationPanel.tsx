import { useRef, useEffect } from 'react';
import type { NotificationItem } from '../types';

interface NotificationPanelProps {
  notifications: NotificationItem[];
  isOpen: boolean;
  onClose: () => void;
  onNavigateToElement: (elementId: string) => void;
}

function formatTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return '刚刚';
}

function getInitials(name: string): string {
  return name.charAt(0).toUpperCase();
}

function getNotificationText(notification: NotificationItem): string {
  switch (notification.type) {
    case 'userJoin':
      return '加入了画布';
    case 'userLeave':
      return '离开了画布';
    case 'like':
      return '赞了一个元素';
    case 'comment':
      return `评论: ${notification.text || ''}`;
    case 'draw':
      return '画了新内容';
    case 'addNote':
      return '添加了新便签';
    default:
      return '';
  }
}

export function NotificationPanel({
  notifications,
  isOpen,
  onClose,
  onNavigateToElement
}: NotificationPanelProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [notifications.length]);

  if (!isOpen) {
    return null;
  }

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.title}>通知</span>
        <button style={styles.closeBtn} onClick={onClose}>
          ×
        </button>
      </div>

      <div ref={listRef} style={styles.list}>
        {notifications.length === 0 ? (
          <div style={styles.empty}>暂无通知</div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              style={styles.notificationItem}
              onClick={() => {
                if (notification.elementId) {
                  onNavigateToElement(notification.elementId);
                }
              }}
            >
              <div
                style={{
                  ...styles.avatar,
                  backgroundColor: notification.userColor
                }}
              >
                {getInitials(notification.username)}
              </div>
              <div style={styles.content}>
                <div style={styles.text}>
                  <span style={styles.username}>{notification.username}</span>
                  <span style={styles.action}>{getNotificationText(notification)}</span>
                </div>
                <div style={styles.time}>{formatTime(notification.timestamp)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    width: 280,
    height: '100%',
    backgroundColor: '#1e1e1e',
    borderLeft: '1px solid #2a2a2a',
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideIn 250ms ease'
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #2a2a2a',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    color: '#e0e0e0'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: 24,
    cursor: 'pointer',
    padding: 0,
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 200ms ease'
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: 8
  },
  empty: {
    textAlign: 'center',
    color: '#666',
    padding: 40,
    fontSize: 14
  },
  notificationItem: {
    display: 'flex',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'background-color 200ms ease',
    animation: 'fadeIn 300ms ease'
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 600,
    color: '#fff',
    flexShrink: 0
  },
  content: {
    flex: 1,
    minWidth: 0
  },
  text: {
    fontSize: 13,
    color: '#e0e0e0',
    lineHeight: 1.4
  },
  username: {
    fontWeight: 600,
    marginRight: 4
  },
  action: {
    color: '#aaa'
  },
  time: {
    fontSize: 11,
    color: '#666',
    marginTop: 4
  }
};
