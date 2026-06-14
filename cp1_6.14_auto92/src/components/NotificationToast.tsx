import { X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function NotificationToast() {
  const { notifications, removeNotification } = useAppStore();

  if (notifications.length === 0) return null;

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
        >
          <div className="flex items-center justify-between gap-4">
            <span>{notification.message}</span>
            <button
              onClick={() => removeNotification(notification.id)}
              className="p-0.5 hover:bg-white/20 rounded transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
