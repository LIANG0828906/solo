import { useState, useEffect } from 'react';
import { useAppStore } from '@/store';
import styles from './NotificationBar.module.css';

function NotificationBar() {
  const notifications = useAppStore((state) => state.notifications);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const newIds = new Set(notifications.map((n) => n.id));
    setVisibleIds(newIds);
  }, [notifications]);

  return (
    <div className={styles.container}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${styles.notification} ${
            visibleIds.has(notification.id) ? '' : styles.notificationExit
          }`}
        >
          {notification.message}
        </div>
      ))}
    </div>
  );
}

export default NotificationBar;
