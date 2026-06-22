import { useState, useEffect, useRef, useCallback } from 'react';

export interface FPSData {
  current: number;
  average: number;
}

const FRAME_HISTORY_SIZE = 10;

export function useFPSMonitor(isActive: boolean = true): FPSData {
  const [fps, setFps] = useState<FPSData>({ current: 60, average: 60 });
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const frameTimesRef = useRef<number[]>([]);
  const rafIdRef = useRef<number | null>(null);

  const measure = useCallback(() => {
    const now = performance.now();
    frameCountRef.current++;

    const delta = now - lastTimeRef.current;

    if (delta >= 1000) {
      const currentFPS = Math.round((frameCountRef.current * 1000) / delta);

      frameTimesRef.current.push(currentFPS);
      if (frameTimesRef.current.length > FRAME_HISTORY_SIZE) {
        frameTimesRef.current.shift();
      }

      const averageFPS = Math.round(
        frameTimesRef.current.reduce((sum, val) => sum + val, 0) / frameTimesRef.current.length
      );

      setFps({ current: currentFPS, average: averageFPS });

      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }

    rafIdRef.current = requestAnimationFrame(measure);
  }, []);

  useEffect(() => {
    if (!isActive) {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }

    frameCountRef.current = 0;
    lastTimeRef.current = performance.now();
    rafIdRef.current = requestAnimationFrame(measure);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isActive, measure]);

  return fps;
}
