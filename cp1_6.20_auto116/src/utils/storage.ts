import type { FavoriteItem, HSLColor } from '../types/color';

const FAVORITES_KEY = 'color_palette_favorites';
const SETTINGS_KEY = 'color_palette_settings';

export interface AppSettings {
  lastBaseColor?: HSLColor;
  lastSelectedType?: string;
  gradientSteps?: number;
}

export const loadFavorites = (): FavoriteItem[] => {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load favorites:', e);
  }
  return [];
};

export const saveFavorites = (favorites: FavoriteItem[]): void => {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (e) {
    console.error('Failed to save favorites:', e);
  }
};

export const addFavorite = (item: FavoriteItem): FavoriteItem[] => {
  const favorites = loadFavorites();
  favorites.unshift(item);
  saveFavorites(favorites);
  return favorites;
};

export const removeFavorite = (id: string): FavoriteItem[] => {
  const favorites = loadFavorites().filter(f => f.id !== id);
  saveFavorites(favorites);
  return favorites;
};

export const clearFavorites = (): FavoriteItem[] => {
  saveFavorites([]);
  return [];
};

export const loadSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return {};
};

export const saveSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
};

export const getStorageUsage = (): { used: number; available: number } => {
  let used = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      used += localStorage[key].length * 2;
    }
  }
  const available = 5 * 1024 * 1024 - used;
  return { used, available };
};

export const exportAllData = (): string => {
  return JSON.stringify({
    favorites: loadFavorites(),
    settings: loadSettings(),
    exportedAt: new Date().toISOString(),
  }, null, 2);
};

export const importData = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (data.favorites) {
      saveFavorites(data.favorites);
    }
    if (data.settings) {
      saveSettings(data.settings);
    }
    return true;
  } catch (e) {
    console.error('Failed to import data:', e);
    return false;
  }
};
