import { useNutritionStore } from '@/store/useNutritionStore';
import { Bell, X, Sparkles, AlarmClock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ReminderBanner() {
  const { notification, dismissNotification } = useNutritionStore();

  if (!notification) return null;

  const isReminder = notification.type === 'reminder';
  const Icon = isReminder ? AlarmClock : Sparkles;
  const bgClass = isReminder
    ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
    : 'bg-gradient-to-r from-primary-50 to-emerald-50 border-primary-200';
  const iconBgClass = isReminder ? 'bg-amber-100 text-amber-600' : 'bg-primary-100 text-primary-600';
  const textClass = isReminder ? 'text-amber-800' : 'text-primary-800';

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-sm animate-shake mb-4',
        bgClass,
      )}
    >
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', iconBgClass)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn('text-sm font-semibold', textClass)}>
          {isReminder ? '温馨提醒' : '营养建议'}
        </div>
        <div className={cn('text-sm mt-0.5', textClass)}>
          {notification.message}
        </div>
      </div>
      <button
        onClick={dismissNotification}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-white/60 hover:text-gray-600 transition-all active:scale-90 flex-shrink-0"
        aria-label="关闭"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
