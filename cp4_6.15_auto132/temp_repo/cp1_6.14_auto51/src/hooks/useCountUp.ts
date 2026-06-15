import { useState, useEffect, useRef } from 'react';

interface UseCountUpOptions {
  end: number;
  duration?: number;
  startOnMount?: boolean;
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function useCountUp({
  end,
  duration = 1500,
  startOnMount = true,
}: UseCountUpOptions) {
  const [value, setValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);

  const animate = (timestamp: number) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = timestamp;
    }

    const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
    const easedProgress = easeOutExpo(progress);
    const currentValue = Math.round(easedProgress * end);

    setValue(currentValue);

    if (progress < 1) {
      frameRef.current = requestAnimationFrame(animate);
    } else {
      isAnimatingRef.current = false;
    }
  };

  const start = () => {
    if (isAnimatingRef.current) return;
    
    isAnimatingRef.current = true;
    startTimeRef.current = null;
    setValue(0);
    frameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (startOnMount) {
      start();
    }

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, duration, startOnMount]);

  return { value, start };
}
