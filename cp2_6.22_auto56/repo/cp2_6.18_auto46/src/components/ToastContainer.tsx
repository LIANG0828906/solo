import { useAppStore } from '../store/appStore';

export default function ToastContainer() {
  const toasts = useAppStore(state => state.toasts) || [];
  const dismissToast = useAppStore(state => state.dismissToast);

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast ${toast.type}`}
          onClick={() => dismissToast(toast.id)}
          style={{ cursor: 'pointer' }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
