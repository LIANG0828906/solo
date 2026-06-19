import { useEffect } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import './NotificationToast.css';

export default function NotificationToast() {
  const { notifications, removeNotification } = useOrderStore();

  useEffect(() => {
    notifications.forEach((n) => {
      const timer = setTimeout(() => {
        removeNotification(n.id);
      }, 2000);
      return () => clearTimeout(timer);
    });
  }, [notifications, removeNotification]);

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <div key={notification.id} className="notification-toast glass-card">
          <span className="notification-icon">🔔</span>
          <span className="notification-content">{notification.content}</span>
        </div>
      ))}
    </div>
  );
}
