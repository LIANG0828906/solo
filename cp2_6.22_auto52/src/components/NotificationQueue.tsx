import React, { useState, useEffect, useCallback } from 'react';

const TYPE_COLORS: Record<string, string> = {
  'rule-triggered': '#e8b83a',
  alert: '#ef5350',
  device: '#42a5f5',
};

const TYPE_ICONS: Record<string, string> = {
  'rule-triggered': '⚡',
  alert: '🚨',
  device: '🔌',
};

interface Notification {
  id: string;
  type: string;
  message: string;
  timestamp: number;
}

interface ToastItem {
  notification: Notification;
  visible: boolean;
}

interface NotificationQueueProps {
  notifications: Notification[];
}

const NotificationQueue: React.FC<NotificationQueueProps> = ({ notifications }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());

  const addToast = useCallback((notif: Notification) => {
    setToasts((prev) => [...prev, { notification: notif, visible: true }]);

    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) =>
          t.notification.id === notif.id ? { ...t, visible: false } : t
        )
      );
    }, 2700);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.notification.id !== notif.id));
    }, 3100);
  }, []);

  useEffect(() => {
    for (const notif of notifications) {
      if (!processedIds.has(notif.id)) {
        setProcessedIds((prev) => new Set(prev).add(notif.id));
        addToast(notif);
      }
    }
  }, [notifications, processedIds, addToast]);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const openDrawer = () => {
    setDrawerOpen(true);
    const ids = new Set(notifications.map((n) => n.id));
    setReadIds(ids);
  };

  const sortedNotifications = [...notifications]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 100);

  return (
    <>
      <div style={styles.toastContainer}>
        {toasts.map((toast) => {
          const color = TYPE_COLORS[toast.notification.type] || '#e8b83a';
          return (
            <div
              key={toast.notification.id}
              style={{
                ...styles.toast,
                animation: toast.visible
                  ? 'slideInRight 0.3s ease-out forwards'
                  : 'fadeOut 0.3s ease forwards',
              }}
            >
              <div style={{ ...styles.shakeLine, background: color }} />
              <div style={styles.toastContent}>
                <span style={styles.toastIcon}>
                  {TYPE_ICONS[toast.notification.type] || '📢'}
                </span>
                <span style={styles.toastMsg}>{toast.notification.message}</span>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={openDrawer} style={styles.bellBtn}>
        🔔
        {unreadCount > 0 && (
          <span style={styles.badge}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {drawerOpen && (
        <>
          <div style={styles.drawerOverlay} onClick={() => setDrawerOpen(false)} />
          <div style={styles.drawer}>
            <div style={styles.drawerHeader}>
              <h3 style={styles.drawerTitle}>Notifications</h3>
              <button
                onClick={() => setDrawerOpen(false)}
                style={styles.closeBtn}
              >
                ✕
              </button>
            </div>
            <div style={styles.drawerList}>
              {sortedNotifications.length === 0 && (
                <p style={{ color: '#a0a0b0', padding: '1rem', fontSize: 14 }}>
                  No notifications
                </p>
              )}
              {sortedNotifications.map((notif) => {
                const color = TYPE_COLORS[notif.type] || '#e8b83a';
                const time = new Date(notif.timestamp).toLocaleTimeString();
                return (
                  <div key={notif.id} style={styles.drawerItem}>
                    <div
                      style={{
                        ...styles.drawerTypeDot,
                        background: color,
                      }}
                    />
                    <div style={styles.drawerItemContent}>
                      <div style={styles.drawerItemHeader}>
                        <span>{TYPE_ICONS[notif.type] || '📢'}</span>
                        <span style={styles.drawerTime}>{time}</span>
                      </div>
                      <p style={styles.drawerMsg}>{notif.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeOut {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(30px); }
        }
      `}</style>
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  toastContainer: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    display: 'flex',
    flexDirection: 'column-reverse',
    gap: 8,
    zIndex: 2000,
    pointerEvents: 'none',
  },
  toast: {
    background: 'linear-gradient(135deg, #16213e, #0f3460)',
    borderRadius: 10,
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    border: '1px solid rgba(255,255,255,0.08)',
    overflow: 'hidden',
    minWidth: 280,
    maxWidth: 380,
    pointerEvents: 'auto',
  },
  shakeLine: {
    height: 3,
    animation: 'shakeLine 0.4s ease',
  },
  toastContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '0.8rem 1rem',
  },
  toastIcon: {
    fontSize: 18,
    flexShrink: 0,
  },
  toastMsg: {
    fontSize: 13,
    color: '#e0e0e0',
    lineHeight: 1.4,
  },
  bellBtn: {
    position: 'fixed',
    top: 16,
    right: 24,
    background: 'linear-gradient(135deg, #16213e, #0f3460)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '0.5rem 0.7rem',
    fontSize: 20,
    zIndex: 1500,
    boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    background: '#ef5350',
    color: '#fff',
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 8,
    padding: '1px 5px',
    minWidth: 18,
    textAlign: 'center' as const,
  },
  drawerOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.4)',
    zIndex: 2500,
  },
  drawer: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: 360,
    maxWidth: '90vw',
    background: '#1a1a2e',
    borderLeft: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '-4px 0 30px rgba(0,0,0,0.4)',
    zIndex: 2600,
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideInRight 0.3s ease-out',
  },
  drawerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.25rem',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  drawerTitle: {
    fontSize: 16,
    color: '#e0e0e0',
  },
  closeBtn: {
    background: 'transparent',
    color: '#a0a0b0',
    fontSize: 16,
  },
  drawerList: {
    flex: 1,
    overflowY: 'auto',
    padding: '0.5rem',
  },
  drawerItem: {
    display: 'flex',
    gap: 10,
    padding: '0.8rem',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.02)',
    marginBottom: 4,
    borderLeft: '3px solid transparent',
  },
  drawerTypeDot: {
    width: 3,
    flexShrink: 0,
    borderRadius: 2,
    marginTop: 2,
    marginBottom: 2,
  },
  drawerItemContent: {
    flex: 1,
    minWidth: 0,
  },
  drawerItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  drawerTime: {
    fontSize: 11,
    color: '#a0a0b0',
  },
  drawerMsg: {
    fontSize: 13,
    color: '#e0e0e0',
    lineHeight: 1.4,
    wordBreak: 'break-word' as const,
  },
};

export default NotificationQueue;
