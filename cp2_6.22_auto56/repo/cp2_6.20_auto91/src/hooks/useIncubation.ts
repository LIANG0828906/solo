import { useEffect, useRef } from 'react';
import { useIncubationStore } from '../store/incubationStore';

export function useIncubation() {
  const isIncubating = useIncubationStore((state) => state.isIncubating);
  const updateProgress = useIncubationStore((state) => state.updateProgress);
  const lastTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!isIncubating) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = 0;
      }
      return;
    }

    lastTimeRef.current = performance.now();

    const tick = (currentTime: number) => {
      const deltaTime = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      updateProgress(deltaTime);

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isIncubating, updateProgress]);
}
