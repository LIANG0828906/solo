import { useState, useEffect, useCallback, useRef } from 'react';

const REFRESH_INTERVAL = 10000;
const TICK_INTERVAL = 100;

export function useRefreshTimer(onRefresh: () => void, autoRefresh: boolean = true) {
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);
  const lastRefreshRef = useRef(Date.now());

  const tick = useCallback(() => {
    const elapsed = Date.now() - lastRefreshRef.current;
    const newProgress = Math.min(100, (elapsed / REFRESH_INTERVAL) * 100);
    setProgress(newProgress);

    if (elapsed >= REFRESH_INTERVAL) {
      onRefresh();
      lastRefreshRef.current = Date.now();
      setProgress(0);
    }
  }, [onRefresh]);

  const resetTimer = useCallback(() => {
    lastRefreshRef.current = Date.now();
    setProgress(0);
  }, []);

  const manualRefresh = useCallback(() => {
    onRefresh();
    lastRefreshRef.current = Date.now();
    setProgress(0);
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
