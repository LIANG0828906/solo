import React, { useEffect, useState } from 'react';
import { eventBus } from '../eventBus';

interface ToastItem {
  id: number;
  message: string;
  fading: boolean;
}

let idCounter = 0;

export const Toast: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const off = eventBus.on('showToast', ({ message }) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, message, fading: false }]);

      setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, fading: true } : t))
        );
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 300);
      }, 3000);
    });
    return off;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.fading ? 'fading' : ''}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
};
