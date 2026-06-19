import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

const TOAST_DURATION: Record<ToastType, number> = {
  success: 2000,
  info: 3000,
  warning: 4000,
  error: 5000,
};

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = uuidv4();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, TOAST_DURATION[type]);
    },
    []
  );

  const showSuccess = useCallback(
    (msg: string) => showToast(msg, 'success'),
    [showToast]
  );
  const showError = useCallback(
    (msg: string) => showToast(msg, 'error'),
    [showToast]
  );
  const showWarning = useCallback(
    (msg: string) => showToast(msg, 'warning'),
    [showToast]
  );
  const showInfo = useCallback(
    (msg: string) => showToast(msg, 'info'),
    [showToast]
  );

  return { toasts, showToast, showSuccess, showError, showWarning, showInfo };
};
