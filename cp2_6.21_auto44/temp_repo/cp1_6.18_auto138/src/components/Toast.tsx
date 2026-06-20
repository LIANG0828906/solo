import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

const bgColors: Record<NonNullable<ToastProps['type']>, string> = {
  success: '#5B9279',
  error: '#E74C3C',
  info: '#636E72',
};

const Toast = ({ message, type = 'success', onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const enterTimer = setTimeout(() => setIsVisible(true), 10);
    const closeTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 400);
    }, 3000);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(closeTimer);
    };
  }, [onClose]);

  const toastStyle: React.CSSProperties = {
    position: 'fixed',
    top: 20,
    left: '50%',
    transform: isVisible
      ? 'translateX(-50%) translateY(0)'
      : 'translateX(-50%) translateY(-100%)',
    padding: '12px 24px',
    borderRadius: 8,
    color: '#FFFFFF',
    zIndex: 9999,
    transition: 'transform 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
    backgroundColor: bgColors[type],
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    fontSize: 14,
    whiteSpace: 'nowrap',
  };

  return (
    <div style={toastStyle}>
      {message}
    </div>
  );
};

export default Toast;
