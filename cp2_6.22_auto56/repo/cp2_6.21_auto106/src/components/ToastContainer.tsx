import { useAppStore } from '../store';

const ToastContainer = () => {
  const { toasts, removeToast } = useAppStore();

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return { background: '#27ae60', color: '#fff' };
      case 'warning':
        return { background: '#e67e22', color: '#fff' };
      default:
        return { background: '#8e44ad', color: '#fff' };
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          style={{
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: '14px',
            cursor: 'pointer',
            animation: 'fadeIn 0.3s ease-out',
            minWidth: '240px',
            ...getTypeStyles(toast.type),
          }}
        >
          {toast.message}
        </div>
      ))}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ToastContainer;
