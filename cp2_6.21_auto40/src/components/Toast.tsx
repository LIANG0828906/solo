import { useToastStore } from '@/stores/toastStore';
import { X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, hideToast } = useToastStore();

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-item toast-${toast.type || 'info'}`}
          role="status"
        >
          <span className="toast-icon">
            {toast.type === 'success' && '🎉'}
            {toast.type === 'error' && '⚠️'}
            {toast.type === 'info' && '💡'}
          </span>
          <span className="toast-message">{toast.message}</span>
          <button
            className="toast-close"
            onClick={() => hideToast(toast.id)}
            aria-label="关闭提示"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
