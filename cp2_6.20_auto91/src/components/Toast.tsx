import React from 'react';
import { useIncubationStore } from '../store/incubationStore';
import { CheckCircle, Info, AlertTriangle } from 'lucide-react';

const Toast: React.FC = () => {
  const toasts = useIncubationStore((state) => state.toasts);
  const hideToast = useIncubationStore((state) => state.hideToast);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-900/80 border-green-500/50';
      case 'warning':
        return 'bg-yellow-900/80 border-yellow-500/50';
      default:
        return 'bg-blue-900/80 border-blue-500/50';
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-center gap-3 px-6 py-3 rounded-xl border backdrop-blur-md
            ${getBgColor(toast.type)}
            animate-[slideUp_0.3s_ease-out,fadeOut_0.5s_ease-in_4.5s_forwards]
            shadow-lg shadow-black/30
          `}
          style={{
            fontFamily: "'Lato', sans-serif",
          }}
        >
          {getIcon(toast.type)}
          <span className="text-white/90 font-medium">{toast.message}</span>
          <button
            onClick={() => hideToast(toast.id)}
            className="ml-2 text-white/50 hover:text-white/80 transition-colors"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
