import { useEffect } from 'react';
import { ToastMessage } from '@/types';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

const toastStyles: Record<string, React.CSSProperties> = {
  success: { background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' },
  error: { background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)' },
  info: { background: 'linear-gradient(135deg, #e94560 0%, #ff6b6b 100%)' },
};

export function Toast({ toasts, onDismiss }: ToastProps) {
  return (
    <div style={containerStyle}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 2000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      style={{
        ...toastStyle,
        background: toastStyles[toast.type].background,
        animation: 'fadeIn 0.3s ease-out',
      }}
      onClick={() => onDismiss(toast.id)}
    >
      <span style={textStyle}>{toast.message}</span>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 20,
  right: 20,
  zIndex: 9999,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  pointerEvents: 'none',
};

const toastStyle: React.CSSProperties = {
  padding: '12px 20px',
  borderRadius: '8px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  pointerEvents: 'auto',
  cursor: 'pointer',
  minWidth: '200px',
  maxWidth: '400px',
};

const textStyle: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 500,
};
