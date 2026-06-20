import { useEffect, useRef, useCallback } from 'react';
import { useStarStore } from '@/store/starStore';

interface UseFpsMonitorOptions {
  windowSize?: number;
  lowFpsThreshold?: number;
  highFpsThreshold?: number;
  adjustInterval?: number;
  onLowFps?: () => void;
  onHighFps?: () => void;
}

export function useFpsMonitor(options: UseFpsMonitorOptions = {}) {
  const {
    windowSize = 30,
    lowFpsThreshold = 50,
    highFpsThreshold = 58,
    adjustInterval = 2000,
  } = options;

  const frameTimes = useRef<number[]>([]);
  const lastAdjustTime = useRef<number>(0);
  const animationFrameId = useRef<number | null>(null);
  const rafCallback = useRef<number | null>(null);

  const setFps = useStarStore((state) => state.setFps);
  const visibleStarCount = useStarStore((state) => state.visibleStarCount);
  const maxStars = useStarStore((state) => state.maxStars);
  const setVisibleStarCount = useStarStore((state) => state.setVisibleStarCount);

  const measureFrame = useCallback(() => {
    const now = performance.now();
    frameTimes.current.push(now);

    if (frameTimes.current.length > windowSize) {
      frameTimes.current.shift();
    }

    if (frameTimes.current.length >= 2) {
      const avgFrameTime =
        (frameTimes.current[frameTimes.current.length - 1] - frameTimes.current[0]) /
        (frameTimes.current.length - 1);
      const fps = 1000 / avgFrameTime;
      setFps(fps);

      if (now - lastAdjustTime.current > adjustInterval) {
        lastAdjustTime.current = now;

        if (fps < lowFpsThreshold && visibleStarCount > 2000) {
          const newCount = Math.max(2000, visibleStarCount - 1000);
          setVisibleStarCount(newCount);
        } else if (fps > highFpsThreshold && visibleStarCount < maxStars) {
          const newCount = Math.min(maxStars, visibleStarCount + 500);
          setVisibleStarCount(newCount);
        }
      }
    }

    rafCallback.current = requestAnimationFrame(measureFrame);
  }, [windowSize, lowFpsThreshold, highFpsThreshold, adjustInterval, setFps, visibleStarCount, maxStars, setVisibleStarCount]);

  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(measureFrame);

    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (rafCallback.current !== null) {
        cancelAnimationFrame(rafCallback.current);
      }
      frameTimes.current = [];
    };
  }, [measureFrame]);

  const getAverageFps = useCallback((): number => {
    if (frameTimes.current.length < 2) return 60;
    const avgFrameTime =
      (frameTimes.current[frameTimes.current.length - 1] - frameTimes.current[0]) /
      (frameTimes.current.length - 1);
    return 1000 / avgFrameTime;
  }, []);

  return { getAverageFps };
}
