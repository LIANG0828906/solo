import { useState, useCallback, useRef, useEffect } from 'react';
import { WRITING_PAUSE_THRESHOLD, STATS_REFRESH_INTERVAL } from '../constants';

export interface WritingTimer {
  elapsedMs: number;
  isRunning: boolean;
  isPaused: boolean;
  startTime: number | null;
  registerActivity: () => void;
  reset: () => void;
}

export function useWritingTimer(): WritingTimer {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(0);
  const accumulatedMsRef = useRef(0);
  const isPausedRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);

  const tick = useCallback(() => {
    if (!startTimeRef.current) return;
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;

    if (timeSinceLastActivity > WRITING_PAUSE_THRESHOLD) {
      if (!isPausedRef.current) {
        accumulatedMsRef.current += now - lastActivityRef.current - WRITING_PAUSE_THRESHOLD;
        isPausedRef.current = true;
        setIsPaused(true);
      }
      setElapsedMs(lastActivityRef.current + WRITING_PAUSE_THRESHOLD - startTimeRef.current - accumulatedMsRef.current);
    } else {
      if (isPausedRef.current) {
        isPausedRef.current = false;
        setIsPaused(false);
      }
      setElapsedMs(now - startTimeRef.current - accumulatedMsRef.current);
    }
  }, []);

  const registerActivity = useCallback(() => {
    const now = Date.now();

    if (!startTimeRef.current) {
      startTimeRef.current = now;
      accumulatedMsRef.current = 0;
      setIsRunning(true);
    } else {
      const timeSinceLastActivity = now - lastActivityRef.current;
      if (isPausedRef.current && timeSinceLastActivity > WRITING_PAUSE_THRESHOLD) {
        accumulatedMsRef.current += timeSinceLastActivity - WRITING_PAUSE_THRESHOLD;
        isPausedRef.current = false;
        setIsPaused(false);
      }
    }

    lastActivityRef.current = now;
    tick();
  }, [tick]);

  const reset = useCallback(() => {
    startTimeRef.current = null;
    lastActivityRef.current = 0;
    accumulatedMsRef.current = 0;
    isPausedRef.current = false;
    setElapsedMs(0);
    setIsRunning(false);
    setIsPaused(false);
  }, []);

  useEffect(() => {
    const interval = setInterval(tick, STATS_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [tick]);

  return {
    elapsedMs,
    isRunning,
    isPaused,
    startTime: startTimeRef.current,
    registerActivity,
    reset,
  };
}
