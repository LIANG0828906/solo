const KEYS_STORAGE_KEY = 'keyvault_keys';
const USAGE_STORAGE_KEY = 'keyvault_usage';

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as T;
    }
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
  }
  return defaultValue;
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

export function loadKeys() {
  return loadFromStorage(KEYS_STORAGE_KEY, []);
}

export function saveKeys(keys: any[]): void {
  saveToStorage(KEYS_STORAGE_KEY, keys);
}

export function loadUsageLogs() {
  return loadFromStorage(USAGE_STORAGE_KEY, []);
}

export function saveUsageLogs(logs: any[]): void {
  saveToStorage(USAGE_STORAGE_KEY, logs);
}
