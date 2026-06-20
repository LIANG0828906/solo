import type { AppState } from '../types';

const STORAGE_KEY = 'grading-feedback-app-state';

export function loadState(): Partial<AppState> | null {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (serialized === null) {
      return null;
    }
    return JSON.parse(serialized) as Partial<AppState>;
  } catch (err) {
    console.warn('Failed to load state from localStorage:', err);
    return null;
  }
}

export function saveState(state: AppState): void {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (err) {
    console.warn('Failed to save state to localStorage:', err);
  }
}

export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timer: number | null = null;
  return ((...args: any[]) => {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = window.setTimeout(() => fn(...args), delay);
  }) as T;
}
