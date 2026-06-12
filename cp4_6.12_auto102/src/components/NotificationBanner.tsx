import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Notification } from '../types';

const NotificationBanner: React.FC = () => {
  const notifications = useGameStore(s => s.notifications);

  return (
    <div style={{ position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)', zIndex: 200, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      {notifications.map(n => (
        <NotificationItem key={n.id} notification={n} />
      ))}
    </div>
  );
};

const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => {
  const [exiting, setExiting] = useState(false);
  const removeNotification = useGameStore(s => s.removeNotification);

  useEffect(() => {
    const timer = setTimeout(() => setExiting(true), 3100);
    return () => clearTimeout(timer);
  }, []);

  const bgColor = notification.type === 'success' ? '#1a3a2a' : notification.type === 'warning' ? '#3a2a1a' : '#1a2a3a';
  const borderColor = notification.type === 'success' ? '#3fb950' : notification.type === 'warning' ? '#f59e0b' : '#58a6ff';

  return (
    <div
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 8,
        padding: '10px 20px',
        color: '#e6edf3',
        fontSize: 13,
        whiteSpace: 'nowrap',
        animation: exiting ? 'slideUp 0.4s forwards' : 'slideDown 0.4s forwards',
        pointerEvents: 'auto',
        boxShadow: `0 2px 12px ${borderColor}30`,
      }}
    >
      {notification.message}
    </div>
  );
};

export default NotificationBanner;
