import React, { useState, useEffect, useRef } from 'react';
import './EnergyBar.css';

interface EnergyBarProps {
  current: number;
  max: number;
  label?: string;
}

type GemState = 'filled' | 'empty' | 'consuming' | 'restoring';

export const EnergyBar: React.FC<EnergyBarProps> = ({
  current,
  max,
  label = '能量',
}) => {
  const gems = Math.min(max, 10);
  const filledGems = Math.min(current, gems);

  const [gemStates, setGemStates] = useState<GemState[]>(
    Array.from({ length: gems }, (_, i) => (i < filledGems ? 'filled' : 'empty'))
  );

  const prevFilledRef = useRef(filledGems);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const prevFilled = prevFilledRef.current;
    const newFilled = filledGems;

    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];

    if (newFilled < prevFilled) {
      const diff = prevFilled - newFilled;
      for (let i = 0; i < diff; i++) {
        const gemIndex = prevFilled - 1 - i;
        const delay = i * 100;

        const timeout1 = setTimeout(() => {
          setGemStates((prev) => {
            const newStates = [...prev];
            newStates[gemIndex] = 'consuming';
            return newStates;
          });
        }, delay);

        const timeout2 = setTimeout(() => {
          setGemStates((prev) => {
            const newStates = [...prev];
            newStates[gemIndex] = 'empty';
            return newStates;
          });
        }, delay + 300);

        timeoutsRef.current.push(timeout1, timeout2);
      }
    } else if (newFilled > prevFilled) {
      const diff = newFilled - prevFilled;
      for (let i = 0; i < diff; i++) {
        const gemIndex = prevFilled + i;
        const delay = i * 100;

        const timeout1 = setTimeout(() => {
          setGemStates((prev) => {
            const newStates = [...prev];
            newStates[gemIndex] = 'restoring';
            return newStates;
          });
        }, delay);

        const timeout2 = setTimeout(() => {
          setGemStates((prev) => {
            const newStates = [...prev];
            newStates[gemIndex] = 'filled';
            return newStates;
          });
        }, delay + 300);

        timeoutsRef.current.push(timeout1, timeout2);
      }
    }

    prevFilledRef.current = newFilled;

    return () => {
      timeoutsRef.current.forEach((t) => clearTimeout(t));
    };
  }, [filledGems]);

  useEffect(() => {
    setGemStates((prev) => {
      const newStates = [...prev];
      while (newStates.length < gems) {
        newStates.push('empty');
      }
      while (newStates.length > gems) {
        newStates.pop();
      }
      if (filledGems > newStates.filter((s) => s === 'filled' || s === 'restoring').length) {
        const filledCount = filledGems;
        for (let i = 0; i < filledCount; i++) {
          if (newStates[i] === 'empty') {
            newStates[i] = 'filled';
          }
        }
      }
      return newStates;
    });
  }, [gems, filledGems]);

  return (
    <div className="energy-bar">
      <span className="energy-label">{label}</span>
      <div className="energy-gems">
        {gemStates.map((state, i) => (
          <div
            key={i}
            className={`energy-gem ${state}`}
          >
            <div className="gem-inner" />
          </div>
        ))}
      </div>
      <span className="energy-value">{current}/{max}</span>
    </div>
  );
};
