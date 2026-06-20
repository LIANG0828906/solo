import { useEffect, useRef, useCallback } from 'react';

interface UsePrecisionTimerOptions {
  duration: number;
  onTick: (remainingTime: number) => void;
  onComplete: () => void;
  autoStart?: boolean;
}

interface UsePrecisionTimerReturn {
  start: () => void;
  pause: () => void;
  reset: (newDuration?: number) => void;
  isRunning: boolean;
  remainingTime: number;
}

export function usePrecisionTimer({
  duration,
  onTick,
  onComplete,
  autoStart = false,
}: UsePrecisionTimerOptions): UsePrecisionTimerReturn {
  const remainingTimeRef = useRef(duration);
  const isRunningRef = useRef(false);
  const startPerfTimeRef = useRef<number>(0);
  const remainingAtStartRef = useRef<number>(duration);
  const animationFrameRef = useRef<number>(0);
  const hasCompletedRef = useRef(false);
  const onTickRef = useRef(onTick);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const tick = useCallback(() => {
    if (!isRunningRef.current) return;

    const now = performance.now();
    const elapsed = now - startPerfTimeRef.current;
    const remaining = Math.max(0, remainingAtStartRef.current - elapsed);

    remainingTimeRef.current = remaining;
    onTickRef.current(remaining);

    if (remaining <= 0) {
      isRunningRef.current = false;
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onCompleteRef.current();
      }
      return;
    }

    animationFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(() => {
    if (isRunningRef.current || remainingTimeRef.current <= 0) return;

    isRunningRef.current = true;
    startPerfTimeRef.current = performance.now();
    remainingAtStartRef.current = remainingTimeRef.current;
    hasCompletedRef.current = false;
    animationFrameRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const pause = useCallback(() => {
    isRunningRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const reset = useCallback((newDuration?: number) => {
    pause();
    const newRemaining = newDuration ?? duration;
    remainingTimeRef.current = newRemaining;
    remainingAtStartRef.current = newRemaining;
    startPerfTimeRef.current = 0;
    hasCompletedRef.current = false;
    onTickRef.current(newRemaining);
  }, [pause, duration]);

  useEffect(() => {
    if (autoStart) {
      start();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [autoStart, start]);

  return {
    start,
    pause,
    reset,
    get isRunning() {
      return isRunningRef.current;
    },
    get remainingTime() {
      return remainingTimeRef.current;
    },
  };
}
