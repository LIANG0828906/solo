import { create } from 'zustand';

interface ToastItem {
  id: number;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

interface ToastStore {
  toasts: ToastItem[];
  showToast: (message: string, options?: { type?: 'success' | 'error' | 'info'; duration?: number }) => void;
  hideToast: (id: number) => void;
}

let toastIdCounter = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  showToast: (message, options = {}) => {
    const id = ++toastIdCounter;
    const { type = 'info', duration = 3000 } = options;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }
  },

  hideToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
