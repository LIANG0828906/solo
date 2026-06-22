import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string;
  visible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, visible, onClose, duration = 2000 }: ToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  if (!visible && !show) return null;

  return (
    <div
      className="fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl border shadow-lg"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'rgba(80, 250, 123, 0.3)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(80, 250, 123, 0.1)',
        opacity: show ? 1 : 0,
        transform: show ? 'translateX(0)' : 'translateX(100%)',
        transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
      }}
    >
      <CheckCircle2 size={20} style={{ color: '#50fa7b' }} />
      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        {message}
      </span>
    </div>
  );
}
