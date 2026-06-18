import { create } from 'zustand';
import { useEffect } from 'react';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: localStorage.getItem('theme') === 'dark',
  toggleTheme: () => {
    const newValue = !get().isDark;
    set({ isDark: newValue });
    localStorage.setItem('theme', newValue ? 'dark' : 'light');
    if (newValue) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  },
}));

export function useThemeInit() {
  const isDark = useThemeStore((s) => s.isDark);
  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDark]);
}
