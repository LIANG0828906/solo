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
  const lastTimestampRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const hasCompletedRef = useRef(false);

  const tick = useCallback((timestamp: number) => {
    if (!isRunningRef.current) return;

    if (lastTimestampRef.current === 0) {
      lastTimestampRef.current = timestamp;
    }

    const delta = timestamp - lastTimestampRef.current;
    lastTimestampRef.current = timestamp;

    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - delta);
    
    onTick(remainingTimeRef.current);

    if (remainingTimeRef.current <= 0) {
      isRunningRef.current = false;
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onComplete();
      }
      return;
    }

    animationFrameRef.current = requestAnimationFrame(tick);
  }, [onTick, onComplete]);

  const start = useCallback(() => {
    if (isRunningRef.current || remainingTimeRef.current <= 0) return;
    
    isRunningRef.current = true;
    lastTimestampRef.current = 0;
    hasCompletedRef.current = false;
    animationFrameRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const pause = useCallback(() => {
    isRunningRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    lastTimestampRef.current = 0;
  }, []);

  const reset = useCallback((newDuration?: number) => {
    pause();
    remainingTimeRef.current = newDuration ?? duration;
    hasCompletedRef.current = false;
    onTick(remainingTimeRef.current);
  }, [pause, duration, onTick]);

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
