import { useEffect, useRef } from 'react';

export function useGameLoop(
  onTick: (deltaSeconds: number) => void,
  enabled = true,
  tickIntervalMs = 100
) {
  const lastTimeRef = useRef<number>(performance.now());
  const accRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    lastTimeRef.current = performance.now();
    accRef.current = 0;

    const loop = (now: number) => {
      const deltaMs = now - lastTimeRef.current;
      lastTimeRef.current = now;
      accRef.current += deltaMs;

      while (accRef.current >= tickIntervalMs) {
        const tickSeconds = tickIntervalMs / 1000;
        onTick(tickSeconds);
        accRef.current -= tickIntervalMs;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [onTick, enabled, tickIntervalMs]);
}
