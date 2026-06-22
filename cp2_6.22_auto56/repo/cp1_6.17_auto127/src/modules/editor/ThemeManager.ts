import { create } from 'zustand';
import type { WeatherTheme, ThemeColors, Poem } from '../types';

interface AppState {
  currentTheme: WeatherTheme;
  currentView: 'editor' | 'wall';
  poems: Poem[];
  setTheme: (theme: WeatherTheme) => void;
  setView: (view: 'editor' | 'wall') => void;
  setPoems: (poems: Poem[]) => void;
  addPoem: (poem: Poem) => void;
  likePoem: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentTheme: 'sunny',
  currentView: 'editor',
  poems: [],
  setTheme: (theme) => set({ currentTheme: theme }),
  setView: (view) => set({ currentView: view }),
  setPoems: (poems) => set({ poems }),
  addPoem: (poem) => set((state) => ({ poems: [poem, ...state.poems] })),
  likePoem: (id) =>
    set((state) => ({
      poems: state.poems.map((p) =>
        p.id === id ? { ...p, likes: p.likes + 1 } : p
      ),
    })),
}));

export const getThemeColors = (theme: WeatherTheme): ThemeColors => {
  const themes: Record<WeatherTheme, ThemeColors> = {
    sunny: { background: '#FFF5E6', primary: '#D4A574', secondary: '#F5DEB3' },
    rainy: { background: '#E6F0FA', primary: '#4A90D9', secondary: '#B0C4DE' },
    snowy: { background: '#F0F8FF', primary: '#C0C0C0', secondary: '#E8E8E8' },
  };
  return themes[theme];
};
