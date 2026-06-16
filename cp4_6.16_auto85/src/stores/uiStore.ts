import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ToastMessage } from '@/types';

interface UIState {
  toasts: ToastMessage[];
  mobileMenuOpen: boolean;
  showToast: (type: ToastMessage['type'], message: string) => void;
  removeToast: (id: string) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  toasts: [],
  mobileMenuOpen: false,

  showToast: (type, message) => {
    const id = uuidv4();
    const toast: ToastMessage = { id, type, message };
    set({ toasts: [...get().toasts, toast] });
    setTimeout(() => {
      get().removeToast(id);
    }, 2500);
  },

  removeToast: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },

  toggleMobileMenu: () => {
    set({ mobileMenuOpen: !get().mobileMenuOpen });
  },

  setMobileMenuOpen: (open) => {
    set({ mobileMenuOpen: open });
  },
}));
