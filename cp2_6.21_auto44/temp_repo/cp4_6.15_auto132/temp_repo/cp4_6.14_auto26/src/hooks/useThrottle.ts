import { useCallback, useRef } from 'react';

export function useThrottle<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  return useCallback(
    ((...args: unknown[]) => {
      const now = Date.now();
      const elapsed = now - lastCallRef.current;

      if (elapsed >= delay) {
        lastCallRef.current = now;
        callback(...args);
      } else if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          lastCallRef.current = Date.now();
          rafRef.current = null;
          callback(...args);
        });
      }
    }) as T,
    [callback, delay]
  );
}
