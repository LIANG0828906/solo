import { create } from 'zustand';
import { ThemeVariables, ThemeKey } from './types';

interface ThemeState {
  theme: ThemeVariables;
  updateTheme: (key: ThemeKey, value: string | number) => void;
  setTheme: (theme: Partial<ThemeVariables>) => void;
}

const defaultTheme: ThemeVariables = {
  colorPrimary: '#1890ff',
  bgColor: '#ffffff',
  textColor: '#333333',
  paddingMd: 16,
  marginMd: 16,
  borderRadius: 8,
  fontSizeMd: 14,
  shadowBlur: 8,
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: defaultTheme,
  updateTheme: (key, value) =>
    set((state) => ({
      theme: {
        ...state.theme,
        [key]: value,
      },
    })),
  setTheme: (partialTheme) =>
    set((state) => ({
      theme: {
        ...state.theme,
        ...partialTheme,
      },
    })),
}));
