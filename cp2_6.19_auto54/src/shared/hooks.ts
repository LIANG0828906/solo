import { useState, useEffect, useCallback, useRef } from 'react';
import { getDaysRemaining } from './utils';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useCountdown(dueDate: number | undefined, intervalMs: number = 86400000): number {
  const [daysRemaining, setDaysRemaining] = useState<number>(() => {
    return dueDate ? getDaysRemaining(dueDate) : 0;
  });

  useEffect(() => {
    if (!dueDate) return;

    setDaysRemaining(getDaysRemaining(dueDate));

    const timer = setInterval(() => {
      setDaysRemaining(getDaysRemaining(dueDate));
    }, intervalMs);

    return () => {
      clearInterval(timer);
    };
  }, [dueDate, intervalMs]);

  return daysRemaining;
}

export function useAnimationTrigger(duration: number = 500): [boolean, () => void] {
  const [isAnimating, setIsAnimating] = useState(false);

  const trigger = useCallback(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration]);

  return [isAnimating, trigger];
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue((prev) => {
      const valueToStore = value instanceof Function ? value(prev) : value;
      try {
        localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (e) {
        console.error('Error saving to localStorage:', e);
      }
      return valueToStore;
    });
  }, [key]);

  return [storedValue, setValue];
}

export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef<() => void>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => {
      savedCallback.current?.();
    }, delay);

    return () => {
      clearInterval(id);
    };
  }, [delay]);
}
