import type { AppState, Project } from '@/types';

const STORAGE_KEY = 'inspiration-board-data';

export const saveToStorage = (state: AppState): void => {
  try {
    const startTime = performance.now();
    const data = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, data);
    const duration = performance.now() - startTime;
    if (duration > 3) {
      console.warn(`Storage write took ${duration.toFixed(2)}ms, exceeding 3ms target`);
    }
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

export const loadFromStorage = (): AppState | null => {
  try {
    const startTime = performance.now();
    const data = localStorage.getItem(STORAGE_KEY);
    const duration = performance.now() - startTime;
    if (duration > 3) {
      console.warn(`Storage read took ${duration.toFixed(2)}ms, exceeding 3ms target`);
    }
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return null;
  }
};

export const saveProjectBackup = (projectId: string, project: Project): void => {
  try {
    const startTime = performance.now();
    const backupKey = `backup-${projectId}`;
    const data = JSON.stringify(project);
    localStorage.setItem(backupKey, data);
    const duration = performance.now() - startTime;
    if (duration > 3) {
      console.warn(`Backup write took ${duration.toFixed(2)}ms, exceeding 3ms target`);
    }
  } catch (error) {
    console.error('Failed to save backup:', error);
  }
};

export const loadProjectBackup = (projectId: string): Project | null => {
  try {
    const backupKey = `backup-${projectId}`;
    const data = localStorage.getItem(backupKey);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load backup:', error);
    return null;
  }
};

export const clearStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
};
