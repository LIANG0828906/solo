import { useState, useEffect, useRef } from 'react';

export function useCountUp(target: number, startOnMount = true) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const isAnimatingRef = useRef(false);
  const fromValueRef = useRef(0);

  const animate = (toValue: number) => {
    const fromValue = fromValueRef.current;
    const magnitude = Math.max(Math.abs(toValue - fromValue), 1);
    const duration = Math.min(Math.max(magnitude * 4, 500), 1500);

    const tick = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(fromValue + (toValue - fromValue) * eased);
      setValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setValue(toValue);
        isAnimatingRef.current = false;
      }
    };

    isAnimatingRef.current = true;
    startTimeRef.current = undefined;
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (!startOnMount && !isAnimatingRef.current) {
      setValue(target);
      fromValueRef.current = target;
      return;
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    animate(target);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromValueRef.current = target;
    };
  }, [target, startOnMount]);

  return value;
}
