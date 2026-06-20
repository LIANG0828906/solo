import { useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';

interface ToastItem {
  id: number;
  message: string;
  visible: boolean;
}

let toastContainer: HTMLDivElement | null = null;
let root: Root | null = null;
let toastId = 0;
let toasts: ToastItem[] = [];
let renderCallback: (() => void) | null = null;

function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    renderCallback = () => setItems([...toasts]);
    return () => {
      renderCallback = null;
    };
  }, []);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] flex flex-col gap-2">
      {items.map((toast) => (
        <div
          key={toast.id}
          className="px-5 py-3 bg-green-500 text-white rounded-lg shadow-lg font-medium"
          style={{
            animation: toast.visible
              ? 'slideDown 0.3s ease-out forwards'
              : 'slideUp 0.3s ease-in forwards',
          }}
        >
          {toast.message}
        </div>
      ))}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
}

function ensureContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
    root = createRoot(toastContainer);
    root.render(<ToastContainer />);
  }
}

export function showToast(message: string, duration = 3000): number {
  ensureContainer();

  const id = ++toastId;
  const newToast: ToastItem = {
    id,
    message,
    visible: true,
  };

  toasts = [...toasts, newToast];
  renderCallback?.();

  if (duration > 0) {
    setTimeout(() => {
      const index = toasts.findIndex((t) => t.id === id);
      if (index > -1) {
        toasts[index].visible = false;
        renderCallback?.();

        setTimeout(() => {
          toasts = toasts.filter((t) => t.id !== id);
          renderCallback?.();
        }, 300);
      }
    }, duration);
  }

  return id;
}

export default ToastContainer;
