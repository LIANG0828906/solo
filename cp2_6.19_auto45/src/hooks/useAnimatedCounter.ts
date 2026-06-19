import { useEffect, useRef, useState } from 'react';

export function useAnimatedCounter(target: number, durationMs = 350) {
  const [display, setDisplay] = useState(target);
  const startRef = useRef<number>(target);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === display) return;
    startRef.current = display;
    startTimeRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = startRef.current + (target - startRef.current) * eased;
      setDisplay(val);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs]);

  return display;
}
