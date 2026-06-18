import { useProjectStore } from '@/store/projectStore';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const typeStyles = {
  success: 'bg-success',
  error: 'bg-danger',
  info: 'bg-[#3B82F6]',
};

const typeIcons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

export default function NotificationToast() {
  const { notifications, removeNotification } = useProjectStore(
    (state) => ({
      notifications: state.notifications,
      removeNotification: state.removeNotification,
    })
  );

  return (
    <div className="pointer-events-none fixed top-4 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2">
      {notifications.map((notification) => {
        const Icon = typeIcons[notification.type];
        return (
          <div
            key={notification.id}
            className={cn(
              'pointer-events-auto flex items-center gap-3 rounded-lg px-4 py-3 text-white shadow-lg',
              typeStyles[notification.type]
            )}
            style={{
              animation: 'fadeIn 0.3s ease-out',
            }}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">{notification.message}</span>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-2 flex-shrink-0 rounded-full p-0.5 transition-colors hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
