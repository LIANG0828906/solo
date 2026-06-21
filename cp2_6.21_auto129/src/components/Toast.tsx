import { useStore } from '@/store';
import './Toast.css';

export default function Toast() {
  const toasts = useStore((s) => s.toasts);

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast-item">
          {toast.message}
        </div>
      ))}
    </div>
  );
}
