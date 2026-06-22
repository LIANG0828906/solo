import type { Asset } from '@/types';

const STORAGE_KEY = 'portfolio_assets';

export const saveAssetsToStorage = (assets: Asset[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
  } catch (error) {
    console.error('Failed to save assets to localStorage:', error);
  }
};

export const loadAssetsFromStorage = (): Asset[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load assets from localStorage:', error);
  }
  return [];
};

export const clearStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
};
