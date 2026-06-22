import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';

interface UseCountdownOptions {
  initialTime: number;
  onEnd?: () => void;
  autoStart?: boolean;
}

interface UseCountdownReturn {
  timeRemaining: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: (newTime?: number) => void;
}

export const useCountdown = ({
  initialTime,
  onEnd,
  autoStart = false,
}: UseCountdownOptions): UseCountdownReturn => {
  const intervalRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);
  const hasEndedRef = useRef(false);

  const {
    timeRemaining,
    setTimeRemaining,
    decrementTime,
    setIsWarning,
  } = useGameStore();

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isRunningRef.current = false;
  }, []);

  const tick = useCallback(() => {
    const currentTime = useGameStore.getState().timeRemaining;

    if (currentTime <= 0) {
      clearTimer();
      setIsWarning(false);
      if (!hasEndedRef.current) {
        hasEndedRef.current = true;
        onEnd?.();
      }
      return;
    }

    decrementTime();

    if (currentTime <= 10 && currentTime > 0) {
      setIsWarning(true);
    }
  }, [decrementTime, setIsWarning, onEnd, clearTimer]);

  const start = useCallback(() => {
    if (isRunningRef.current) return;
    if (intervalRef.current) {
      clearTimer();
    }

    hasEndedRef.current = false;
    isRunningRef.current = true;
    intervalRef.current = window.setInterval(tick, 1000);
  }, [tick, clearTimer]);

  const pause = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const reset = useCallback(
    (newTime?: number) => {
      clearTimer();
      hasEndedRef.current = false;
      const time = newTime ?? initialTime;
      setTimeRemaining(time);
      setIsWarning(time <= 10 && time > 0);
    },
    [clearTimer, initialTime, setTimeRemaining, setIsWarning]
  );

  useEffect(() => {
    if (autoStart && initialTime > 0) {
      setTimeRemaining(initialTime);
      start();
    }

    return () => {
      clearTimer();
    };
  }, [autoStart, initialTime, setTimeRemaining, start, clearTimer]);

  const isRunning = isRunningRef.current;

  return {
    timeRemaining,
    isRunning,
    start,
    pause,
    reset,
  };
};
