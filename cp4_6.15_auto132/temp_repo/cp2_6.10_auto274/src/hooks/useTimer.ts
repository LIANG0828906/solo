import { useState, useEffect, useRef, useCallback } from 'react';
import { useFragmentStore } from '../store/useFragmentStore';

interface TimerState {
  isRunning: boolean;
  elapsedTime: number;
  formattedTime: string;
}

interface TimerControls {
  start: () => void;
  pause: () => void;
  reset: () => void;
  getTime: () => number;
}

export type UseTimerReturn = TimerState & TimerControls;

export function useTimer(autoStart = false): UseTimerReturn {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);

  const setElapsedTimeStore = useFragmentStore((state) => state.setElapsedTime);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const tick = useCallback(() => {
    const now = Date.now();
    const elapsed = accumulatedTimeRef.current + (now - startTimeRef.current) / 1000;
    setElapsedTime(elapsed);
    setElapsedTimeStore(Math.floor(elapsed));
  }, [setElapsedTimeStore]);

  const start = useCallback(() => {
    if (isRunning) return;

    startTimeRef.current = Date.now();
    setIsRunning(true);

    intervalRef.current = window.setInterval(tick, 1000);
  }, [isRunning, tick]);

  const pause = useCallback(() => {
    if (!isRunning) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    accumulatedTimeRef.current = elapsedTime;
    setIsRunning(false);
  }, [isRunning, elapsedTime]);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    accumulatedTimeRef.current = 0;
    startTimeRef.current = 0;
    setElapsedTime(0);
    setIsRunning(false);
    setElapsedTimeStore(0);
  }, [setElapsedTimeStore]);

  const getTime = useCallback((): number => {
    if (isRunning) {
      const now = Date.now();
      return accumulatedTimeRef.current + (now - startTimeRef.current) / 1000;
    }
    return elapsedTime;
  }, [isRunning, elapsedTime]);

  useEffect(() => {
    if (autoStart) {
      start();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoStart, start]);

  const formattedTime = formatTime(elapsedTime);

  return {
    isRunning,
    elapsedTime,
    formattedTime,
    start,
    pause,
    reset,
    getTime,
  } as const;
}
