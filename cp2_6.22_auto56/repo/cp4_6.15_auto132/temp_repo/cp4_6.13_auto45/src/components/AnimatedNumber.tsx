import React, { useRef, useEffect, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  decimals = 0,
  duration = 500,
  className = '',
}) => {
  const [display, setDisplay] = useState(value);
  const prevValueRef = useRef(value);
  const rafRef = useRef<number | null>(null);
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    const startValue = prevValueRef.current;
    const endValue = value;
    const startTime = performance.now();

    if (startValue === endValue) return;

    setDirection(endValue > startValue ? 'up' : 'down');

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOut(progress);
      const current = startValue + (endValue - startValue) * eased;
      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(endValue);
        prevValueRef.current = endValue;
        setTimeout(() => setDirection(null), 200);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return (
    <span
      className={`${className} inline-block transition-all duration-200 ${
        direction === 'up' ? '-translate-y-0.5 text-green-700' : ''
      } ${direction === 'down' ? 'translate-y-0.5 text-red-700' : ''}`}
    >
      {display.toFixed(decimals)}
    </span>
  );
};
