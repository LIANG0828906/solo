import { useEffect, useRef, useState, useCallback } from 'react';

interface FpsMonitorResult {
  fps: number;
  isDegraded: boolean;
  frameTimes: number[];
}

const SAMPLE_WINDOW = 30;
const DEGRADE_THRESHOLD = 30;
const RECOVER_THRESHOLD = 50;

export const useFpsMonitor = (isActive: boolean): FpsMonitorResult => {
  const [fps, setFps] = useState<number>(60);
  const [isDegraded, setIsDegraded] = useState<boolean>(false);
  const frameTimesRef = useRef<number[]>([]);
  const lastFrameRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  const measureFrame = useCallback((timestamp: number) => {
    if (lastFrameRef.current > 0) {
      const delta = timestamp - lastFrameRef.current;
      frameTimesRef.current.push(delta);
      if (frameTimesRef.current.length > SAMPLE_WINDOW) {
        frameTimesRef.current.shift();
      }

      if (frameTimesRef.current.length >= 10) {
        const avgDelta =
          frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
        const currentFps = Math.round(1000 / avgDelta);
        setFps(currentFps);

        if (currentFps < DEGRADE_THRESHOLD && !isDegraded) {
          setIsDegraded(true);
        } else if (currentFps > RECOVER_THRESHOLD && isDegraded) {
          setIsDegraded(false);
        }
      }
    }
    lastFrameRef.current = timestamp;

    if (isActive) {
      rafIdRef.current = requestAnimationFrame(measureFrame);
    }
  }, [isActive, isDegraded]);

  useEffect(() => {
    if (isActive) {
      lastFrameRef.current = 0;
      frameTimesRef.current = [];
      rafIdRef.current = requestAnimationFrame(measureFrame);
    } else {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      frameTimesRef.current = [];
      setFps(60);
      setIsDegraded(false);
    }

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isActive, measureFrame]);

  return {
    fps,
    isDegraded,
    frameTimes: [...frameTimesRef.current]
  };
};
