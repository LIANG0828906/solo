import { useStore } from '../store/useStore';

export default function Toast() {
  const { toasts, hideToast } = useStore();

  const bgColors: Record<string, string> = {
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f97316',
    info: '#3b82f6',
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 32,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => hideToast(toast.id)}
          style={{
            padding: '12px 24px',
            background: bgColors[toast.type],
            color: 'white',
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            animation: 'toast-in 0.3s ease',
            fontSize: 14,
            fontWeight: 500,
            minWidth: 200,
            textAlign: 'center',
          }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
