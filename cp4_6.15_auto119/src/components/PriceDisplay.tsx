import { useState, useEffect, useRef } from 'react';

interface PriceDisplayProps {
  value: number;
}

export default function PriceDisplay({ value }: PriceDisplayProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current === value) return;
    setIsAnimating(true);
    const diff = value - prevValue.current;
    const steps = 20;
    const increment = diff / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      if (step >= steps) {
        setDisplayValue(value);
        setIsAnimating(false);
        prevValue.current = value;
        clearInterval(interval);
      } else {
        setDisplayValue(Math.round((prevValue.current + increment * step) * 100) / 100);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [value]);

  return (
    <div className={`transition-transform duration-300 ${isAnimating ? 'scale-105' : 'scale-100'}`}>
      <span className="text-3xl font-display font-bold text-walnut">
        ¥{displayValue.toFixed(2)}
      </span>
    </div>
  );
}
