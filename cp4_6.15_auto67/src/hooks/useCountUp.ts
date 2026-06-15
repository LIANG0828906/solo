import { useState, useEffect, useRef } from 'react';

export function useCountUp(target: number, startOnMount = true) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const fromValueRef = useRef(0);
  const lastValueRef = useRef(0);

  useEffect(() => {
    if (!startOnMount) {
      setValue(target);
      fromValueRef.current = target;
      lastValueRef.current = target;
      return;
    }

    const fromValue = lastValueRef.current;
    const diff = target - fromValue;
    const magnitude = Math.max(Math.abs(diff), 1);
    const steps = Math.min(Math.max(magnitude, 20), 60);
    const duration = Math.min(Math.max(steps * 20, 400), 1200);
    const stepMs = duration / steps;

    let step = 0;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const tick = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 2);
      const current = Math.round(fromValue + diff * eased);

      setValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setValue(target);
        lastValueRef.current = target;
        fromValueRef.current = target;
      }
    };

    startTimeRef.current = undefined;
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, startOnMount]);

  return value;
}
