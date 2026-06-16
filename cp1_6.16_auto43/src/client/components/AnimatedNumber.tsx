import React, { useState, useEffect, useRef } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, duration = 800 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const startValue = prevValue.current;
    const endValue = value;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + (endValue - startValue) * easeProgress);
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValue.current = value;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{displayValue}</span>;
};

export default AnimatedNumber;
