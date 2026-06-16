import { useAppStore } from '@/store/useAppStore';
import { CheckCircle, Info, AlertTriangle } from 'lucide-react';
import './Toast.css';

const iconMap = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
};

export const Toast = () => {
  const toasts = useAppStore(state => state.toasts);

  return (
    <div className="toast-container">
      {toasts.map((toast, index) => {
        const Icon = iconMap[toast.type];
        return (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <Icon size={18} />
            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
};
