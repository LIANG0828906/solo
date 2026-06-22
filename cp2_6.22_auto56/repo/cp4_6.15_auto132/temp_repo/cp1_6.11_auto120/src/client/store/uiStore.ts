import { create } from 'zustand';

interface Toast {
  id: string;
  msg: string;
  type: 'error' | 'info';
}

interface UIState {
  loadingRequests: number;
  toasts: Toast[];
  beginRequest: () => void;
  endRequest: () => void;
  pushToast: (msg: string, type?: 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

let toastIdCounter = 0;

export const useUIStore = create<UIState>((set, get) => ({
  loadingRequests: 0,
  toasts: [],

  beginRequest: () => {
    set((state) => ({ loadingRequests: state.loadingRequests + 1 }));
  },

  endRequest: () => {
    set((state) => ({ loadingRequests: Math.max(0, state.loadingRequests - 1) }));
  },

  pushToast: (msg: string, type: 'error' | 'info' = 'error') => {
    const id = `toast-${Date.now()}-${toastIdCounter++}`;
    const toast: Toast = { id, msg, type };
    set((state) => ({ toasts: [...state.toasts, toast] }));
    setTimeout(() => {
      get().removeToast(id);
    }, 4000);
  },

  removeToast: (id: string) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));
