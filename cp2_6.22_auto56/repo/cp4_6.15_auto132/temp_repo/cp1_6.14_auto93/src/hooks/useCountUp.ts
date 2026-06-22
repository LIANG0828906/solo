import { useState, useEffect, useRef } from 'react';

interface UseCountUpOptions {
  duration?: number;
  delay?: number;
  decimals?: number;
  start?: number;
}

interface UseCountUpResult {
  value: number;
  reset: () => void;
}

export function useCountUp(
  target: number,
  options: UseCountUpOptions = {}
): UseCountUpResult {
  const {
    duration = 1500,
    delay = 0,
    decimals = 0,
    start = 0,
  } = options;

  const [value, setValue] = useState(start);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (hasAnimatedRef.current) {
      setValue(target);
      return;
    }

    let timeoutId: number | undefined;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = start + (target - start) * easeOut;

      setValue(Number(currentValue.toFixed(decimals)));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        hasAnimatedRef.current = true;
      }
    };

    timeoutId = window.setTimeout(() => {
      animationRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      startTimeRef.current = null;
    };
  }, [target, duration, delay, decimals, start]);

  const reset = () => {
    hasAnimatedRef.current = false;
    startTimeRef.current = null;
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }
    setValue(start);
  };

  return { value, reset };
}
