import type { Board, ThemeName, Theme } from '../types/board';

const STORAGE_KEY = 'inspireboard_state';
const THEME_KEY = 'inspireboard_theme';

export interface PersistedState {
  boards: Board[];
  activeBoardId: string;
}

export function saveState(state: PersistedState): void {
  try {
    const data = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, data);
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

export function loadState(): PersistedState | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as PersistedState;
  } catch (e) {
    console.error('Failed to load state:', e);
    return null;
  }
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function saveTheme(theme: ThemeName): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    console.error('Failed to save theme:', e);
  }
}

export function loadTheme(): ThemeName | null {
  try {
    return localStorage.getItem(THEME_KEY) as ThemeName | null;
  } catch {
    return null;
  }
}

export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export const LIGHT_THEME: Theme = {
  name: 'light',
  backgroundColor: '#fef9f0',
  gridColor: 'rgba(0, 0, 0, 1)',
  gridOpacity: 0.06,
  textColor: '#2d3436',
  panelBg: 'rgba(255, 255, 255, 0.82)',
  toolbarBg: 'rgba(255, 255, 255, 0.72)',
};

export const DARK_THEME: Theme = {
  name: 'dark',
  backgroundColor: '#1a1a2e',
  gridColor: 'rgba(255, 255, 255, 1)',
  gridOpacity: 0.08,
  textColor: '#f5f6fa',
  panelBg: 'rgba(26, 26, 46, 0.9)',
  toolbarBg: 'rgba(26, 26, 46, 0.82)',
};

export function getTheme(name: ThemeName): Theme {
  return name === 'dark' ? DARK_THEME : LIGHT_THEME;
}
