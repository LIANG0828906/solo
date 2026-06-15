import { useEffect, useRef, useState } from 'react';

export function useAnimatedNumber(target: number, duration = 500) {
  const [displayValue, setDisplayValue] = useState(target);
  const animationRef = useRef<number | null>(null);
  const startValueRef = useRef(target);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === displayValue) return;

    startValueRef.current = displayValue;
    startTimeRef.current = null;

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOut(progress);
      const currentValue =
        startValueRef.current + (target - startValueRef.current) * easedProgress;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(target);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [target, duration]);

  return displayValue;
}
