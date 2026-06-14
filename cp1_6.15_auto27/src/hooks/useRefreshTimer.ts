import { useState, useEffect, useCallback, useRef } from 'react';

const REFRESH_INTERVAL = 10000;
const TICK_INTERVAL = 100;

export function useRefreshTimer(onRefresh: () => void, autoRefresh: boolean = true) {
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<number | null>(null);
  const lastRefreshRef = useRef(Date.now());

  const tick = useCallback(() => {
    const elapsed = Date.now() - lastRefreshRef.current;
    const newProgress = Math.min(100, (elapsed / REFRESH_INTERVAL) * 100);
    setProgress(newProgress);

    if (elapsed >= REFRESH_INTERVAL) {
      lastRefreshRef.current = Date.now();
      setProgress(0);
      onRefresh();
    }
  }, [onRefresh]);

  const resetTimer = useCallback(() => {
    lastRefreshRef.current = Date.now();
    setProgress(0);
  }, []);

  const manualRefresh = useCallback(() => {
    lastRefreshRef.current = Date.now();
    setProgress(0);
    onRefresh();
  }, [onRefresh]);

  useEffect(() => {
    if (!autoRefresh) return;

    timerRef.current = window.setInterval(tick, TICK_INTERVAL);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [autoRefresh, tick]);

  return { progress, resetTimer, manualRefresh };
}
