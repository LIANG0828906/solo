import React, { useEffect, useCallback } from 'react';
import { Bell, X, MapPin } from 'lucide-react';
import { useSeatStore } from '../stores/seatStore';
import type { NotificationItem } from '../types';

interface ToastProps {
  notification: NotificationItem;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  return (
    <div
      className="animate-toast-in"
      style={{
        width: 280,
        backgroundColor: '#2D2D44',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(78, 205, 196, 0.3)',
        position: 'relative',
      }}
    >
      <button
        onClick={() => onClose(notification.id)}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          width: 24,
          height: 24,
          borderRadius: '50%',
          border: 'none',
          backgroundColor: 'rgba(99, 110, 114, 0.2)',
          color: '#A0A0B0',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <X size={12} />
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: 'rgba(78, 205, 196, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Bell size={18} color="#4ECDC4" />
        </div>
        <div style={{ flex: 1, paddingRight: 20 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#E0E0E0',
              marginBottom: 4,
              lineHeight: 1.4,
            }}
          >
            {notification.message}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              color: '#4ECDC4',
            }}
          >
            <MapPin size={12} />
            <span>{notification.seatInfo}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotificationToast: React.FC = () => {
  const notifications = useSeatStore((state) => state.notifications);
  const dismissNotification = useSeatStore((state) => state.dismissNotification);

  const handleClose = useCallback(
    (id: string) => {
      dismissNotification(id);
    },
    [dismissNotification]
  );

  if (notifications.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {notifications.map((n) => (
        <Toast key={n.id} notification={n} onClose={handleClose} />
      ))}
    </div>
  );
};
