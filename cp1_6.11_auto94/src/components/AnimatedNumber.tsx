import React, { useState, useEffect, useRef } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 300,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const startRef = useRef<number>(value);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = displayValue;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startRef.current + (value - startRef.current) * easeOut;

      if (progress >= 1) {
        setDisplayValue(value);
      } else {
        setDisplayValue(Math.round(current));
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    if (displayValue !== value) {
      rafRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, duration, displayValue]);

  return (
    <span className={`number-roll ${className}`}>
      {displayValue}
    </span>
  );
};

export default AnimatedNumber;
