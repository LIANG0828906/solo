import type { AppState } from '../types';

const STORAGE_KEY = 'pomodoro_kanban_state_v1';

export function saveState(state: Partial<AppState>): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        const serialized = JSON.stringify(state);
        localStorage.setItem(STORAGE_KEY, serialized);
      } catch (e) {
        console.error('Failed to save state:', e);
      }
      resolve();
    }, 50);
  });
}

export function loadState(): Promise<Partial<AppState> | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        const serialized = localStorage.getItem(STORAGE_KEY);
        if (!serialized) {
          resolve(null);
          return;
        }
        const parsed = JSON.parse(serialized) as Partial<AppState>;
        resolve(parsed);
      } catch (e) {
        console.error('Failed to load state:', e);
        resolve(null);
      }
    }, 100);
  });
}
