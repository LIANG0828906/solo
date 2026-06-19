import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CURRENCY_SYMBOLS } from '@/modules/trip/types';
import type { CurrencyCode } from '@/modules/trip/types';

interface NumberRollerProps {
  value: number;
  currency?: string;
  duration?: number;
  decimals?: number;
  className?: string;
}

const Digit: React.FC<{ value: string; offset: number }> = ({ value, offset }) => {
  return (
    <span
      className="digit-roller"
      style={{
        transform: `translateY(${offset}%)`,
        transition: 'transform 300ms ease-out',
      }}
    >
      {value}
    </span>
  );
};

const NumberRoller: React.FC<NumberRollerProps> = ({
  value,
  currency,
  duration = 300,
  decimals = 2,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [prevValue, setPrevValue] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  
  const symbol = currency ? (CURRENCY_SYMBOLS[currency as CurrencyCode] || currency) : '';
  
  useEffect(() => {
    if (value === prevValue) return;
    
    setPrevValue(displayValue);
    startTimeRef.current = null;
    
    const animate = (currentTime: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime;
      }
      
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = prevValue + (value - prevValue) * easeProgress;
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, prevValue, duration]);
  
  const formattedValue = useMemo(() => {
    return displayValue.toLocaleString('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }, [displayValue, decimals]);
  
  const digits = useMemo(() => {
    return formattedValue.split('').map((char, index) => {
      if (/\d/.test(char)) {
        const prevStr = prevValue.toLocaleString('zh-CN', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
        const prevChar = prevStr[index] || '0';
        const offset = (parseInt(prevChar) - parseInt(char)) * 100;
        return <Digit key={index} value={char} offset={offset} />;
      }
      return <span key={index}>{char}</span>;
    });
  }, [formattedValue, prevValue, decimals]);
  
  return (
    <span className={`number-roller ${className}`}>
      {symbol && <span className="number-roller-symbol">{symbol}</span>}
      <span className="number-roller-digits">{digits}</span>
    </span>
  );
};

export default NumberRoller;
