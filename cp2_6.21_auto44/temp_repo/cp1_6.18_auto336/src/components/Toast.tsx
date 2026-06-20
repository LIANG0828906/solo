import { useEffect } from 'react';

interface ToastProps {
  message: string;
  visible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, visible, onClose, duration = 2000 }: ToastProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#2C1810',
        color: '#F9F6F0',
        padding: '12px 28px',
        borderRadius: 8,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        fontSize: '0.95rem',
        zIndex: 9999,
        animation: 'toastIn 0.3s ease-out',
      }}
    >
      {message}
    </div>
  );
}
