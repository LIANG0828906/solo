import React, { useEffect, useState } from 'react';
import '../styles/SuccessToast.css';

interface SuccessToastProps {
  message: string | null;
  onClose?: () => void;
}

const SuccessToast: React.FC<SuccessToastProps> = ({ message, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, 1700);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message && !visible) return null;

  return (
    <div className={`toast-container ${visible ? 'toast-visible' : 'toast-hidden'}`}>
      <div className="toast-content">
        <div className="toast-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <span className="toast-message">{message}</span>
      </div>
    </div>
  );
};

export default SuccessToast;
