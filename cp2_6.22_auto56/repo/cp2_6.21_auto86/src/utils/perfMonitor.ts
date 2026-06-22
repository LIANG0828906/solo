import { useEffect, useRef, useCallback } from 'react';
import { usePlantStore } from '../stores/plantStore';

const FPS_HISTORY_SIZE = 10;
const NODE_COUNT_HIGH_THRESHOLD = 200;
const FPS_LOW_THRESHOLD = 30;

export function usePerfMonitor() {
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const fpsHistoryRef = useRef<number[]>([]);
  const frameCount = useRef(0);

  const {
    updateFps: setFps,
    totalNodeCount,
    setLeafUpdateInterval,
    setLeafSwingIterations,
    setLeafDetailLevel,
    setTextureResolution,
    setPerformanceLevel,
  } = usePlantStore();

  const updateFps = useCallback((fps: number) => {
    fpsHistoryRef.current.push(fps);
    if (fpsHistoryRef.current.length > FPS_HISTORY_SIZE) {
      fpsHistoryRef.current.shift();
    }

    const avgFps = fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length;
    setFps(Math.round(avgFps));

    if (avgFps < FPS_LOW_THRESHOLD) {
      setLeafUpdateInterval(2);
      setLeafSwingIterations(4);
      setPerformanceLevel('low');
    } else if (avgFps < 45) {
      setLeafUpdateInterval(1);
      setLeafSwingIterations(6);
      setPerformanceLevel('medium');
    } else {
      setLeafUpdateInterval(1);
      setLeafSwingIterations(8);
      setPerformanceLevel('high');
    }
  }, [setFps, setLeafUpdateInterval, setLeafSwingIterations, setPerformanceLevel]);

  useEffect(() => {
    if (totalNodeCount > NODE_COUNT_HIGH_THRESHOLD) {
      setLeafDetailLevel('reduced');
      setTextureResolution(128);
    } else {
      setLeafDetailLevel('full');
      setTextureResolution(256);
    }
  }, [totalNodeCount, setLeafDetailLevel, setTextureResolution]);

  const tick = useCallback(() => {
    frameCount.current += 1;
    frameCountRef.current += 1;

    const now = performance.now();
    const delta = now - lastTimeRef.current;

    if (delta >= 500) {
      const fps = (frameCountRef.current * 1000) / delta;
      updateFps(fps);
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }

    return frameCount.current;
  }, [updateFps]);

  return { tick, frameCount };
}

export default usePerfMonitor;
