import { useStore } from '../store';
import { Check, X } from 'lucide-react';
import '../index.css';

export default function NotificationBar() {
  const { notifications, removeNotification } = useStore();

  if (notifications.length === 0) return null;

  const getStyles = (type: 'success' | 'error' | 'info') => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-500',
          icon: <Check className="w-5 h-5 text-white" />,
          animation: 'slideDown 0.3s ease-out',
        };
      case 'error':
        return {
          bg: 'bg-red-500',
          icon: <X className="w-5 h-5 text-white" />,
          animation: 'slideDown 0.3s ease-out',
        };
      case 'info':
        return {
          bg: 'bg-blue-500',
          icon: <Check className="w-5 h-5 text-white" />,
          animation: 'slideDown 0.3s ease-out',
        };
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center gap-2 pt-4 pointer-events-none">
      {notifications.map((notification) => {
        const styles = getStyles(notification.type);
        return (
          <div
            key={notification.id}
            className={`${styles.bg} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 pointer-events-auto min-w-[280px] max-w-md`}
            style={{ animation: styles.animation }}
          >
            {styles.icon}
            <span className="flex-1 font-medium">{notification.message}</span>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
