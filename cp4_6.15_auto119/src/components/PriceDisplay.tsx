import { useState, useEffect, useRef } from 'react';

interface SlotDigitProps {
  value: number;
  duration?: number;
}

function SlotDigit({ value, duration = 500 }: SlotDigitProps) {
  const [offset, setOffset] = useState(0);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current === value) return;

    setOffset(prevValue.current - value);
    const timer = setTimeout(() => {
      setOffset(0);
    }, 30);

    prevValue.current = value;
    return () => clearTimeout(timer);
  }, [value]);

  const translateY = offset * 100;

  return (
    <div className="inline-flex flex-col overflow-hidden align-bottom" style={{ height: '1.2em' }}>
      <div
        style={{
          transform: `translateY(${translateY}%)`,
          transition: `transform ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
        }}
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center justify-center" style={{ height: '1.2em' }}>
            {((value - offset + i + 100) % 10)}
          </div>
        ))}
      </div>
    </div>
  );
}

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
    const steps = 25;
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
    }, 16);

    return () => clearInterval(interval);
  }, [value]);

  const formatted = displayValue.toFixed(2);
  const [intPart, decPart] = formatted.split('.');
  const digits = intPart.split('');

  return (
    <div className={`inline-flex items-baseline transition-transform duration-300 ${isAnimating ? 'scale-[1.08]' : 'scale-100'}`}>
      <span className="text-3xl font-display font-bold text-walnut mr-1">¥</span>
      {digits.map((d, i) => (
        <SlotDigit
          key={`${i}-${displayValue}`}
          value={parseInt(d)}
          duration={600 + i * 50}
        />
      ))}
      <span className="text-3xl font-display font-bold text-walnut">.</span>
      <SlotDigit
        key={`dec1-${displayValue}`}
        value={parseInt(decPart[0])}
        duration={800}
      />
      <SlotDigit
        key={`dec2-${displayValue}`}
        value={parseInt(decPart[1])}
        duration={850}
      />
    </div>
  );
}
