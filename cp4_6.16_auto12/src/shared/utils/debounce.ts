import { useRef, useCallback } from 'react';

export function useThrottledAction<T extends (...args: unknown[]) => Promise<void>>(
  action: T,
  cooldownMs: number = 500,
): T {
  const lastCallRef = useRef(0);
  const processingRef = useRef(false);

  return useCallback(
    async (...args: Parameters<T>) => {
      const now = Date.now();
      if (processingRef.current) return;
      if (now - lastCallRef.current < cooldownMs) return;

      lastCallRef.current = now;
      processingRef.current = true;

      try {
        await action(...args);
      } finally {
        setTimeout(() => {
          processingRef.current = false;
        }, cooldownMs);
      }
    },
    [action, cooldownMs],
  ) as T;
}

export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };
}
