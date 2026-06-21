import { Info, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore, type ToastType } from '@/state/appStore';

const TOAST_ICONS: Record<ToastType, typeof Info> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
};

const TOAST_STYLES: Record<ToastType, string> = {
  info: 'border-sky-200 bg-white/95 text-sky-800 shadow-sky-100/50',
  success: 'border-emerald-200 bg-white/95 text-emerald-800 shadow-emerald-100/50',
  warning: 'border-amber-200 bg-white/95 text-amber-800 shadow-amber-100/50',
};

const TOAST_ICON_BG: Record<ToastType, string> = {
  info: 'bg-sky-100 text-sky-600',
  success: 'bg-emerald-100 text-emerald-600',
  warning: 'bg-amber-100 text-amber-600',
};

export default function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts);
  const removeToast = useAppStore((s) => s.removeToast);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed left-1/2 top-4 z-[100] flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-2 px-4"
    >
      {toasts.map((toast) => {
        const Icon = TOAST_ICONS[toast.type];
        return (
          <div
            key={toast.id}
            role="status"
            className={cn(
              'pointer-events-auto flex w-full items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md animate-toast-in',
              TOAST_STYLES[toast.type]
            )}
            style={{ animationFillMode: 'both' }}
          >
            <div
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                TOAST_ICON_BG[toast.type]
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <p className="flex-1 pt-0.5 text-sm font-medium leading-relaxed">{toast.message}</p>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="关闭通知"
              className={cn(
                '-mr-1 -mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all',
                'hover:bg-black/5 active:scale-95 text-gray-400 hover:text-gray-600'
              )}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
