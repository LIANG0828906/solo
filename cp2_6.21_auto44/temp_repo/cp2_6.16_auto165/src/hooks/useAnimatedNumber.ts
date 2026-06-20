import { useState, useEffect, useRef } from 'react';

export function useAnimatedNumber(targetValue: number, duration: number = 800): number {
  const [currentValue, setCurrentValue] = useState<number>(targetValue);
  const startValueRef = useRef<number>(targetValue);
  const startTimeRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    startValueRef.current = currentValue;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress;
      const newValue = startValueRef.current + (targetValue - startValueRef.current) * eased;

      setCurrentValue(newValue);

      if (progress < 1) {
        rafIdRef.current = requestAnimationFrame(animate);
      }
    };

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [targetValue, duration]);

  return currentValue;
}
