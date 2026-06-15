const STORAGE_PREFIX = 'edu_grader_';

export function saveData<T>(key: string, data: T): void {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(STORAGE_PREFIX + key, serialized);
  } catch (e) {
    console.error('Failed to save data:', e);
  }
}

export function loadData<T>(key: string): T | null {
  try {
    const serialized = localStorage.getItem(STORAGE_PREFIX + key);
    if (serialized === null) return null;
    return JSON.parse(serialized) as T;
  } catch (e) {
    console.error('Failed to load data:', e);
    return null;
  }
}

export function removeData(key: string): void {
  localStorage.removeItem(STORAGE_PREFIX + key);
}
