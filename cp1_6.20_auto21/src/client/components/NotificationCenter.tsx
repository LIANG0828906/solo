import React from 'react';
import { useApp } from '../context/AppContext';
import './NotificationCenter.css';

export default function NotificationCenter() {
  const { notifications, removeNotification } = useApp();

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return { bg: '#27AE60', icon: '✓' };
      case 'error':
        return { bg: '#E74C3C', icon: '✕' };
      case 'info':
      default:
        return { bg: '#3498DB', icon: 'ℹ' };
    }
  };

  return (
    <div className="notification-container">
      {notifications.map((notification) => {
        const styles = getTypeStyles(notification.type);
        return (
          <div
            key={notification.id}
            className="notification-item"
            style={{ backgroundColor: styles.bg }}
          >
            <span className="notification-icon">{styles.icon}</span>
            <span className="notification-message">{notification.message}</span>
            <button
              className="notification-close"
              onClick={() => removeNotification(notification.id)}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
