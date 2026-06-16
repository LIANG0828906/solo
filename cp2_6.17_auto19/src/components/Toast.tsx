import React from 'react';
import { useAppStore } from '../store/useAppStore';
import './Toast.css';

export const Toast: React.FC = () => {
  const toasts = useAppStore(state => state.toasts);
  const removeToast = useAppStore(state => state.removeToast);

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          onClick={() => removeToast(toast.id)}
        >
          <span className="material-icons toast-icon">
            {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
          </span>
          <span className="toast-message">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};
