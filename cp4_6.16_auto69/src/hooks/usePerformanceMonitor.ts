import { useState, useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  fps: number;
  fpsHistory: number[];
  avgFps: number;
  minFps: number;
  maxFps: number;
  renderTime: number;
  isMonitoring: boolean;
}

export function usePerformanceMonitor(enabled = true): PerformanceMetrics {
  const [fps, setFps] = useState(0);
  const [fpsHistory, setFpsHistory] = useState<number[]>([]);
  const [avgFps, setAvgFps] = useState(0);
  const [minFps, setMinFps] = useState(0);
  const [maxFps, setMaxFps] = useState(0);
  const [renderTime, setRenderTime] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(0);
  const rafIdRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const framesRef = useRef<number[]>([]);

  const measureFrame = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) {
      lastTimeRef.current = timestamp;
    }

    frameCountRef.current++;

    const delta = timestamp - lastTimeRef.current;

    if (delta >= 1000) {
      const currentFps = Math.round((frameCountRef.current * 1000) / delta);
      setFps(currentFps);

      framesRef.current.push(currentFps);
      if (framesRef.current.length > 60) {
        framesRef.current.shift();
      }

      const history = [...framesRef.current];
      setFpsHistory(history);

      if (history.length > 0) {
        const avg = history.reduce((a, b) => a + b, 0) / history.length;
        setAvgFps(Math.round(avg));
        setMinFps(Math.min(...history));
        setMaxFps(Math.max(...history));
      }

      frameCountRef.current = 0;
      lastTimeRef.current = timestamp;
    }

    if (isMonitoring && enabled) {
      rafIdRef.current = requestAnimationFrame(measureFrame);
    }
  }, [isMonitoring, enabled]);

  const startMonitoring = useCallback(() => {
    if (!enabled || isMonitoring) return;
    setIsMonitoring(true);
    startTimeRef.current = performance.now();
    framesRef.current = [];
    frameCountRef.current = 0;
    lastTimeRef.current = 0;
    rafIdRef.current = requestAnimationFrame(measureFrame);
  }, [enabled, isMonitoring, measureFrame]);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = 0;
    }
    const totalTime = performance.now() - startTimeRef.current;
    setRenderTime(totalTime);
  }, []);

  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (enabled && !isMonitoring) {
      startMonitoring();
    }
    return () => {
      if (isMonitoring) {
        stopMonitoring();
      }
    };
  }, [enabled, isMonitoring, startMonitoring, stopMonitoring]);

  return {
    fps,
    fpsHistory,
    avgFps,
    minFps,
    maxFps,
    renderTime,
    isMonitoring,
  };
}

export function measureRenderTime<T extends unknown[]>(
  fn: (...args: T) => void
): (...args: T) => number {
  return (...args: T) => {
    const start = performance.now();
    fn(...args);
    const end = performance.now();
    const duration = end - start;
    console.debug(`[Performance] Render took ${duration.toFixed(2)}ms`);
    return duration;
  };
}

export async function measureAsync<T>(
  label: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  console.debug(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
  return { result, duration };
}
