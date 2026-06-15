import { X, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import './Notification.css';

const iconMap = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle
};

export default function Notification() {
  const { notifications, removeNotification } = useStore();

  return (
    <div className="notification-container">
      {notifications.map((notification) => {
        const Icon = iconMap[notification.type];
        return (
          <div
            key={notification.id}
            className={`notification-item ${notification.type} slide-in-right`}
          >
            <Icon className="notification-icon" size={20} />
            <span className="notification-message">{notification.message}</span>
            <button
              className="notification-close"
              onClick={() => removeNotification(notification.id)}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
