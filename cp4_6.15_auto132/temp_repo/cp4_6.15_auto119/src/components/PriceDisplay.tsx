import { useState, useEffect, useRef, useMemo } from 'react';

interface SlotDigitProps {
  value: number;
  duration?: number;
}

function SlotDigit({ value, duration = 500 }: SlotDigitProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current === value) return;

    const diff = value - prevValue.current;
    const steps = 10;
    const increment = diff / steps;
    let step = 0;

    setIsAnimating(true);

    const interval = setInterval(() => {
      step++;
      if (step >= steps) {
        setDisplayValue(value);
        setIsAnimating(false);
        prevValue.current = value;
        clearInterval(interval);
      } else {
        setDisplayValue(Math.round(((prevValue.current + increment * step) % 10) + 10) % 10);
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [value, duration]);

  return (
    <span
      className="inline-block"
      style={{
        transition: `transform ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
        transform: isAnimating ? 'translateY(-2px) scale(1.05)' : 'translateY(0) scale(1)',
      }}
    >
      {displayValue}
    </span>
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

  const priceBreakdown = useMemo(() => {
    if (displayValue >= 2000) return { text: '精品定制', color: 'text-amber-600' };
    if (displayValue >= 500) return { text: '品质之选', color: 'text-sky-600' };
    return { text: '经济实惠', color: 'text-green-600' };
  }, [displayValue]);

  return (
    <div className="text-right">
      <div className={`transition-transform duration-300 ${isAnimating ? 'scale-[1.08]' : 'scale-100'}`}>
        <span className="text-3xl font-display font-bold text-walnut mr-1">¥</span>
        {digits.map((d, i) => (
          <span key={i} className="text-3xl font-display font-bold text-walnut">
            <SlotDigit
              key={`digit-${i}-${displayValue}`}
              value={parseInt(d)}
              duration={500 + i * 40}
            />
          </span>
        ))}
        <span className="text-3xl font-display font-bold text-walnut">.</span>
        <SlotDigit
          key={`dec1-${displayValue}`}
          value={parseInt(decPart[0])}
          duration={650}
        />
        <SlotDigit
          key={`dec2-${displayValue}`}
          value={parseInt(decPart[1])}
          duration={700}
        />
      </div>
      <div className={`text-xs font-body mt-1 ${priceBreakdown.color}`}>
        {priceBreakdown.text}
      </div>
    </div>
  );
}
