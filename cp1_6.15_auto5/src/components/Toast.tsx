import { useState, useEffect } from 'react';
import type { ToastMessage } from '../types';
import styles from './Toast.module.css';

interface ToastProps {
  toasts: ToastMessage[];
}

interface ToastItemState extends ToastMessage {
  isLeaving: boolean;
}

function Toast({ toasts }: ToastProps) {
  const [toastStates, setToastStates] = useState<ToastItemState[]>([]);

  useEffect(() => {
    const newToastIds = toasts.map(t => t.id);
    const existingIds = toastStates.map(t => t.id);

    const toastsToAdd = toasts
      .filter(t => !existingIds.includes(t.id))
      .map(t => ({ ...t, isLeaving: false }));

    const toastsToRemove = toastStates
      .filter(t => !newToastIds.includes(t.id) && !t.isLeaving)
      .map(t => ({ ...t, isLeaving: true }));

    if (toastsToAdd.length > 0 || toastsToRemove.length > 0) {
      const remainingToasts = toastStates
        .filter(t => !toastsToRemove.find(r => r.id === t.id) || t.isLeaving)
        .map(t => {
          const toRemove = toastsToRemove.find(r => r.id === t.id);
          return toRemove ? { ...t, isLeaving: true } : t;
        });

      setToastStates([...remainingToasts, ...toastsToAdd]);

      toastsToRemove.forEach(t => {
        setTimeout(() => {
          setToastStates(prev => prev.filter(s => s.id !== t.id));
        }, 350);
      });
    }
  }, [toasts, toastStates]);

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

  if (toastStates.length === 0) return null;

  return (
    <div className={styles.container}>
      {toastStates.map((toast, index) => (
        <div
          key={toast.id}
          className={`${styles.toast} ${getTypeStyles(toast.type)} ${toast.isLeaving ? styles.leaving : styles.entering}`}
          style={{
            animationDelay: toast.isLeaving ? '0ms' : `${index * 80}ms`,
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
