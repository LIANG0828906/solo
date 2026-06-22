import type { DesktopLayout } from '@/types';

const STORAGE_KEY = 'desktop_layout';
const USER_PREFS_KEY = 'desktop_prefs';

export interface UserPreferences {
  theme: 'light' | 'dark';
  gridSize: { cols: number; rows: number };
  sidebarAutoHide: boolean;
}

const defaultPrefs: UserPreferences = {
  theme: 'light',
  gridSize: { cols: 8, rows: 6 },
  sidebarAutoHide: true,
};

export const storageService = {
  saveLayout(layout: DesktopLayout): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch (e) {
      console.error('Failed to save layout:', e);
    }
  },

  loadLayout(): DesktopLayout | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to load layout:', e);
      return null;
    }
  },

  clearLayout(): void {
    localStorage.removeItem(STORAGE_KEY);
  },

  savePrefs(prefs: Partial<UserPreferences>): void {
    try {
      const existing = this.loadPrefs();
      localStorage.setItem(USER_PREFS_KEY, JSON.stringify({ ...existing, ...prefs }));
    } catch (e) {
      console.error('Failed to save preferences:', e);
    }
  },

  loadPrefs(): UserPreferences {
    try {
      const data = localStorage.getItem(USER_PREFS_KEY);
      return data ? { ...defaultPrefs, ...JSON.parse(data) } : defaultPrefs;
    } catch (e) {
      console.error('Failed to load preferences:', e);
      return defaultPrefs;
    }
  },
};
