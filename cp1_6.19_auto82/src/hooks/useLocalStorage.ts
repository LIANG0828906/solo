import { useState, useEffect, useCallback, useRef } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`读取 localStorage 键 "${key}" 失败:`, error);
      return initialValue;
    }
  });

  const writeTimeoutRef = useRef<number | null>(null);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        try {
          if (writeTimeoutRef.current !== null) {
            window.clearTimeout(writeTimeoutRef.current);
          }
          writeTimeoutRef.current = window.setTimeout(() => {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
            writeTimeoutRef.current = null;
          }, 100);
        } catch (error) {
          console.warn(`写入 localStorage 键 "${key}" 失败:`, error);
        }
        return valueToStore;
      });
    },
    [key],
  );

  useEffect(() => {
    return () => {
      if (writeTimeoutRef.current !== null) {
        window.clearTimeout(writeTimeoutRef.current);
      }
    };
  }, []);

  return [storedValue, setValue];
}
