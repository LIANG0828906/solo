import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CURRENCY_SYMBOLS } from '@/modules/trip/types';
import type { CurrencyCode } from '@/modules/trip/types';

interface NumberRollerProps {
  value: number;
  currency?: string;
  duration?: number;
  decimals?: number;
  className?: string;
}

interface DigitState {
  current: string;
  previous: string;
}

const DigitColumn: React.FC<{
  digit: string;
  prevDigit: string;
  progress: number;
  duration: number;
}> = ({ digit, prevDigit, progress, duration }) => {
  const isAnimating = digit !== prevDigit && progress < 1;
  const easeProgress = 1 - Math.pow(1 - progress, 3);

  const oldRotation = isAnimating ? -90 * easeProgress : 0;
  const newRotation = isAnimating ? 90 * (1 - easeProgress) : 0;
  const oldOpacity = isAnimating ? 1 - easeProgress : 0;
  const newOpacity = isAnimating ? easeProgress : 1;

  return (
    <span
      style={{
        display: 'inline-block',
        perspective: '300px',
        overflow: 'hidden',
        height: '1.2em',
        width: '0.6em',
        position: 'relative',
        verticalAlign: 'bottom',
      }}
    >
      {isAnimating && (
        <span
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
            transform: `rotateX(${oldRotation}deg)`,
            opacity: oldOpacity,
            transition: `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`,
          }}
        >
          {prevDigit}
        </span>
      )}
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
          transform: `rotateX(${newRotation}deg)`,
          opacity: newOpacity,
          transition: `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`,
        }}
      >
        {digit}
      </span>
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
  const [animProgress, setAnimProgress] = useState(1);
  const [digitStates, setDigitStates] = useState<DigitState[]>([]);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const digitStatesRef = useRef<DigitState[]>([]);
  const forceUpdateRef = useRef(0);
  const [, setTick] = useState(0);

  const symbol = currency ? (CURRENCY_SYMBOLS[currency as CurrencyCode] || currency) : '';

  const formatNumber = useCallback((num: number): string => {
    return num.toLocaleString('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }, [decimals]);

  useEffect(() => {
    const formatted = formatNumber(value);
    const chars = formatted.split('');

    if (digitStatesRef.current.length === 0) {
      const initial = chars.map((c) => ({ current: c, previous: c }));
      digitStatesRef.current = initial;
      setDigitStates(initial);
      return;
    }

    const oldStates = [...digitStatesRef.current];
    const newStates: DigitState[] = [];

    const maxLen = Math.max(oldStates.length, chars.length);
    for (let i = 0; i < maxLen; i++) {
      const oldChar = i < oldStates.length ? oldStates[i].current : '';
      const newChar = i < chars.length ? chars[i] : '';
      newStates.push({
        current: newChar,
        previous: oldChar,
      });
    }

    digitStatesRef.current = newStates;
    setDigitStates(newStates);
    startTimeRef.current = null;
    setAnimProgress(0);

    const animate = (currentTime: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      setAnimProgress(progress);
      forceUpdateRef.current++;
      setTick(forceUpdateRef.current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setAnimProgress(1);
        const settled = newStates.map((s) => ({ current: s.current, previous: s.current }));
        digitStatesRef.current = settled;
        setDigitStates(settled);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration, formatNumber]);

  return (
    <span className={`number-roller ${className}`}>
      {symbol && <span className="number-roller-symbol">{symbol}</span>}
      <span
        className="number-roller-digits"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {digitStates.map((ds, index) => {
          if (/\d/.test(ds.current) || /\d/.test(ds.previous)) {
            return (
              <DigitColumn
                key={index}
                digit={ds.current}
                prevDigit={/\d/.test(ds.previous) ? ds.previous : ds.current}
                progress={animProgress}
                duration={duration}
              />
            );
          }
          return <span key={index}>{ds.current}</span>;
        })}
      </span>
    </span>
  );
};

export default NumberRoller;
