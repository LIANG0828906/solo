import { useGameStore } from '../store/useGameStore';
import { CheckCircle, Info, AlertTriangle, XCircle, X } from 'lucide-react';

const toastIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const toastColors = {
  info: 'text-blue-400',
  success: 'text-green-400',
  warning: 'text-yellow-400',
  error: 'text-red-400',
};

export function Toast() {
  const { toasts, removeToast } = useGameStore();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = toastIcons[toast.type];
        return (
          <div
            key={toast.id}
            className="toast flex items-center gap-3 min-w-[280px]"
          >
            <Icon className={`w-5 h-5 flex-shrink-0 ${toastColors[toast.type]}`} />
            <span className="flex-1 text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
