import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerReturn {
  elapsedMs: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: (newElapsedMs?: number) => void;
}

export function useTimer(initialElapsedMs: number = 0): UseTimerReturn {
  const [elapsedMs, setElapsedMs] = useState<number>(initialElapsedMs);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const startTimeRef = useRef<number>(0);
  const accumulatedMsRef = useRef<number>(initialElapsedMs);
  const animationFrameRef = useRef<number | null>(null);

  const tick = useCallback(() => {
    const now = performance.now();
    const delta = now - startTimeRef.current;
    setElapsedMs(accumulatedMsRef.current + delta);
    animationFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(() => {
    if (isRunning) return;
    startTimeRef.current = performance.now();
    setIsRunning(true);
    animationFrameRef.current = requestAnimationFrame(tick);
  }, [isRunning, tick]);

  const pause = useCallback(() => {
    if (!isRunning) return;
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    const now = performance.now();
    accumulatedMsRef.current += now - startTimeRef.current;
    setElapsedMs(accumulatedMsRef.current);
    setIsRunning(false);
  }, [isRunning]);

  const reset = useCallback((newElapsedMs: number = 0) => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    accumulatedMsRef.current = newElapsedMs;
    setElapsedMs(newElapsedMs);
    setIsRunning(false);
  }, []);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    elapsedMs,
    isRunning,
    start,
    pause,
    reset,
  };
}
