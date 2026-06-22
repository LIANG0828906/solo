import React from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useRouteStore } from '@/data/routeStore';

export const Toast: React.FC = () => {
  const { toast, hideToast } = useRouteStore();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle size={24} className="toast-icon success" />,
    error: <XCircle size={24} className="toast-icon error" />,
    info: <Info size={24} className="toast-icon info" />,
  };

  return (
    <div className="toast-container">
      <div className={`toast toast-${toast.type}`}>
        {icons[toast.type]}
        <span className="toast-message">{toast.message}</span>
        <button 
          className="toast-close"
          onClick={hideToast}
          aria-label="关闭提示"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
