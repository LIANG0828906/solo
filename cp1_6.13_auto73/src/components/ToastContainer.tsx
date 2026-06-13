import { useBoardStore } from '../store/boardStore';
import { Info, CheckCircle, AlertTriangle } from 'lucide-react';

const iconMap = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
};

const colorMap = {
  info: 'border-blue-400 bg-blue-50 text-blue-800',
  success: 'border-green-400 bg-green-50 text-green-800',
  warning: 'border-yellow-400 bg-yellow-50 text-yellow-800',
};

const iconColorMap = {
  info: 'text-blue-500',
  success: 'text-green-500',
  warning: 'text-yellow-500',
};

export const ToastContainer = () => {
  const { toasts, removeToast } = useBoardStore();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type];
        return (
          <div
            key={toast.id}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg border-l-4 shadow-lg
              min-w-[280px] max-w-[400px]
              animate-toast-slide-in
              ${colorMap[toast.type]}
            `}
          >
            <Icon size={20} className={iconColorMap[toast.type]} />
            <span className="text-sm font-medium flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
            >
              &times;
            </button>
          </div>
        );
      })}
    </div>
  );
};
