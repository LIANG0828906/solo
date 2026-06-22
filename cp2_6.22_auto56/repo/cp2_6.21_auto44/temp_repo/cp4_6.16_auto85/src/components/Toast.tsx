import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const classNameMap = {
  success: 'toast-success',
  error: 'toast-error',
  info: 'toast-info',
};

interface ToastItemProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  onRemove: (id: string) => void;
}

function ToastItem({ id, message, type, onRemove }: ToastItemProps) {
  const [exiting, setExiting] = useState(false);
  const Icon = iconMap[type];

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), 2000);
    const removeTimer = setTimeout(() => onRemove(id), 2300);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [id, onRemove]);

  return (
    <div className={`toast ${classNameMap[type]} ${exiting ? 'animate-pop-out' : 'animate-pop-in'}`}>
      <Icon size={20} />
      <span>{message}</span>
    </div>
  );
}

export default function Toast() {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onRemove={removeToast}
        />
      ))}
    </div>
  );
}
