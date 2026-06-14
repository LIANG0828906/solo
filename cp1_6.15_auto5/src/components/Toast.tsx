import type { ToastMessage } from '../types';
import styles from './Toast.module.css';

interface ToastProps {
  toasts: ToastMessage[];
}

function Toast({ toasts }: ToastProps) {
  const getTypeStyles = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success':
        return styles.success;
      case 'warning':
        return styles.warning;
      default:
        return styles.info;
    }
  };

  const getIcon = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className={`${styles.toast} ${getTypeStyles(toast.type)}`}
          style={{
            animation: 'slideInLeft 0.3s ease-out',
            animationDelay: `${index * 0.1}s`,
            animationFillMode: 'both',
          }}
        >
          <span className={styles.icon}>{getIcon(toast.type)}</span>
          <span className={styles.message}>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

export default Toast;
