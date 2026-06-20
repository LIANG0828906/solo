import { useRef, useCallback, useEffect } from 'react';
import throttle from 'lodash.throttle';

export function useThrottleRender<T extends (...args: unknown[]) => void>(
  callback: T,
  wait: number = 100
): T {
  const rafRef = useRef<number | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledFn = useRef(
    throttle((...args: Parameters<T>) => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        callbackRef.current(...args);
        rafRef.current = null;
      });
    }, wait, { leading: true, trailing: true })
  ).current;

  useEffect(() => {
    return () => {
      throttledFn.cancel();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [throttledFn]);

  return useCallback(
    (...args: Parameters<T>) => {
      throttledFn(...args);
    },
    [throttledFn]
  ) as T;
}
