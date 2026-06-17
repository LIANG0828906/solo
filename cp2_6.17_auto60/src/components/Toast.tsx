import { useEffect, useState } from 'react';
import './Toast.css';

interface ToastProps {
  message: string;
  duration?: number;
  visible: boolean;
  onClose?: () => void;
}

export function Toast({ message, duration = 2000, visible, onClose }: ToastProps) {
  const [show, setShow] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      setFadeOut(false);
      const timer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          setShow(false);
          onClose?.();
        }, 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  if (!show) return null;

  return (
    <div className={`toast-container ${fadeOut ? 'toast-fade-out' : ''}`}>
      <div className="toast-message">{message}</div>
    </div>
  );
}
