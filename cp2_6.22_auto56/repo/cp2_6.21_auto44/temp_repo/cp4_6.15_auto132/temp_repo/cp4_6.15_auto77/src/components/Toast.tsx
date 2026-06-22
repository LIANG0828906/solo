import { useEffect } from 'react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, isVisible, onClose, duration = 2000 }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 toast-enter">
      <div className="bg-black/80 text-white px-6 py-3 rounded-card shadow-xl flex items-center gap-2">
        <i className="fas fa-check-circle text-olive-400"></i>
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
}
