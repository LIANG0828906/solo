const STORAGE_KEY_PREFIX = 'fingertip-garden:';

export const localStorageAdapter = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(STORAGE_KEY_PREFIX + key, serialized);
    } catch (error) {
      console.error('Failed to write to localStorage:', error);
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(STORAGE_KEY_PREFIX + key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  },

  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(STORAGE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  },
};
