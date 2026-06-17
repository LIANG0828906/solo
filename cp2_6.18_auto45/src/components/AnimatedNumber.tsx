import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function AnimatedNumber({
  value,
  duration = 500,
  className,
  style,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (value === prevValueRef.current) return;

    const from = prevValueRef.current;
    const to = value;
    const startTime = performance.now();
    startRef.current = startTime;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * eased);
      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevValueRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, duration]);

  return (
    <span className={className} style={style}>
      {displayValue}
    </span>
  );
}

export default AnimatedNumber;
