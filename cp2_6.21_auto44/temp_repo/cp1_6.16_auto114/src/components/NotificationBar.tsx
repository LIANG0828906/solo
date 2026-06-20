import React from 'react';
import { X, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { useGardenStore } from '../store/gardenStore';
import './NotificationBar.css';

const ICON_MAP = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle
};

export const NotificationBar: React.FC = () => {
  const notifications = useGardenStore(s => s.notifications);
  const dismissNotification = useGardenStore(s => s.dismissNotification);

  if (notifications.length === 0) return null;

  return (
    <div className="notification-bar">
      {notifications.map(n => {
        const Icon = ICON_MAP[n.type] || Info;
        return (
          <div key={n.id} className={`notification notification--${n.type}`}>
            <Icon size={18} className="notification__icon" />
            <span className="notification__text">{n.message}</span>
            <button
              type="button"
              className="notification__close"
              onClick={() => dismissNotification(n.id)}
              aria-label="关闭通知"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationBar;
