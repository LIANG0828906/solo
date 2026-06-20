import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimelineStore } from '@/dataManager';
import { NotificationType } from '@/types';

const TYPE_CONFIG: Record<
  NotificationType,
  {
    borderColor: string;
    iconColor: string;
    bgColor: string;
    Icon: typeof CheckCircle;
  }
> = {
  success: {
    borderColor: 'border-success',
    iconColor: 'text-success',
    bgColor: 'bg-green-50',
    Icon: CheckCircle,
  },
  error: {
    borderColor: 'border-danger',
    iconColor: 'text-danger',
    bgColor: 'bg-red-50',
    Icon: XCircle,
  },
  info: {
    borderColor: 'border-primary',
    iconColor: 'text-primary-600',
    bgColor: 'bg-primary-50',
    Icon: Info,
  },
};

export default function NotificationStack() {
  const notifications = useTimelineStore((s) => s.notifications);
  const removeNotification = useTimelineStore((s) => s.removeNotification);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)] pointer-events-none">
      {notifications.map((n) => {
        const cfg = TYPE_CONFIG[n.type];
        const Icon = cfg.Icon;
        return (
          <div
            key={n.id}
            className={cn(
              'flex items-start gap-3 px-4 py-3 rounded-lg border-l-4 bg-white shadow-md',
              cfg.borderColor,
              cfg.bgColor,
              'pointer-events-auto animate-slide-in-right',
            )}
            style={{
              borderLeftWidth: '4px',
            }}
          >
            <Icon
              className={cn('w-5 h-5 flex-shrink-0 mt-0.5', cfg.iconColor)}
              strokeWidth={2}
            />
            <p className="flex-1 text-sm text-gray-800 leading-relaxed break-words">
              {n.message}
            </p>
            <button
              onClick={() => removeNotification(n.id)}
              className={cn(
                'flex-shrink-0 -mr-1 p-0.5 rounded',
                'text-gray-400 hover:text-gray-600 hover:bg-black/5',
                'transition-colors duration-150',
              )}
              aria-label="关闭通知"
            >
              <X className="w-4 h-4" strokeWidth={2.25} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
