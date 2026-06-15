import { useRef, useEffect, useState } from "react";

interface RollingNumberProps {
  value: number;
}

export default function RollingNumber({ value }: RollingNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [animating, setAnimating] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current === value) return;
    setAnimating(true);

    const startVal = prevValue.current;
    const endVal = value;
    const diff = endVal - startVal;
    const duration = 500;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round((startVal + diff * eased) * 100) / 100);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(endVal);
        setAnimating(false);
        prevValue.current = endVal;
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span className={`number-roll-container inline-block ${animating ? "text-warm-orange font-semibold" : ""}`}>
      {displayValue}
    </span>
  );
}
