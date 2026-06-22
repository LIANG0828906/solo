import React, { useEffect } from 'react';
import { useStore } from '@/store/useStore';

interface NotificationProps {
  id: string;
  message: string;
  type: 'info' | 'success';
}

export function Notification({ id, message, type }: NotificationProps) {
  const removeNotification = useStore((state) => state.removeNotification);
  const theme = useStore((state) => state.theme);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      removeNotification(id);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [id, removeNotification]);
  
  const bgColor = type === 'success'
    ? theme === 'dark' ? 'bg-score-high/20 border-score-high' : 'bg-score-high/10 border-score-high'
    : theme === 'dark' ? 'bg-dark-accent2/20 border-dark-accent2' : 'bg-light-accent2/20 border-light-accent2';
  
  const textColor = theme === 'dark' ? 'text-dark-text' : 'text-light-text';
  
  return (
    <div
      className={`animate-slide-in px-4 py-3 rounded-lg shadow-lg border ${bgColor} ${textColor}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">
          {type === 'success' ? '✅' : 'ℹ️'}
        </span>
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}

export function NotificationContainer() {
  const notifications = useStore((state) => state.notifications);
  const theme = useStore((state) => state.theme);
  
  return (
    <div
      className={`fixed top-4 right-4 z-50 space-y-2 ${
        theme === 'dark' ? 'bg-transparent' : 'bg-transparent'
      }`}
    >
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          id={notification.id}
          message={notification.message}
          type={notification.type}
        />
      ))}
    </div>
  );
}