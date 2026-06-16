import { useState, useEffect, useRef } from 'react';

export function useCountUp(target: number, duration = 1000, start = true): number {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!start) return;
    if (target === 0) {
      setCount(0);
      return;
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      const incrementPerFrame = Math.max(1, Math.ceil(target / (duration / 16)));
      const current = Math.min(Math.floor(progress * duration / 16) * incrementPerFrame, target);
      setCount(current);

      if (progress < 1 && current < target) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      startTimeRef.current = null;
    };
  }, [target, duration, start]);

  return count;
}
