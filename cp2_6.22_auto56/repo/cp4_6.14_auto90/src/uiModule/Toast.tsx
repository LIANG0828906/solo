import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  visible: boolean;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, visible, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible && !show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: `translateX(-50%) translateY(${show ? '0' : '20px'})`,
        maxWidth: '400px',
        width: 'auto',
        backgroundColor: '#334155',
        color: '#f8fafc',
        padding: '12px 24px',
        borderRadius: '8px',
        fontSize: '14px',
        zIndex: 9999,
        opacity: show ? 1 : 0,
        transition: 'all 0.3s ease',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {message}
    </div>
  );
};

export default Toast;
