import { create } from 'zustand';
import type { RouteComponent } from '@/modules/router';

interface AppState {
  currentHash: string;
  currentComponent: RouteComponent | null;
  restored: boolean;
  autoSaveEnabled: boolean;
  showSettings: boolean;
  toastMessage: string | null;
  mobileMenuOpen: boolean;
  setCurrentRoute: (hash: string, component: RouteComponent | null, restored: boolean) => void;
  setAutoSaveEnabled: (enabled: boolean) => void;
  setShowSettings: (show: boolean) => void;
  showToast: (message: string) => void;
  hideToast: () => void;
  setMobileMenuOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentHash: '/#/pageA',
  currentComponent: null,
  restored: false,
  autoSaveEnabled: true,
  showSettings: false,
  toastMessage: null,
  mobileMenuOpen: false,
  setCurrentRoute: (hash, component, restored) =>
    set({ currentHash: hash, currentComponent: component, restored }),
  setAutoSaveEnabled: (enabled) => set({ autoSaveEnabled: enabled }),
  setShowSettings: (show) => set({ showSettings: show }),
  showToast: (message) => set({ toastMessage: message }),
  hideToast: () => set({ toastMessage: null }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
}));
