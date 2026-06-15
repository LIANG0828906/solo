import { useState, useEffect, useRef } from 'react';
import { calculateDaysUntilBirthday } from '@/utils/dateUtils';

export function useCountdown(birthday: string): number {
  const [days, setDays] = useState<number>(() =>
    calculateDaysUntilBirthday(birthday)
  );
  const animationRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    const updateCountdown = (timestamp: number) => {
      if (timestamp - lastUpdateRef.current >= 60000) {
        const newDays = calculateDaysUntilBirthday(birthday);
        setDays(newDays);
        lastUpdateRef.current = timestamp;
      }
      animationRef.current = requestAnimationFrame(updateCountdown);
    };

    animationRef.current = requestAnimationFrame(updateCountdown);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [birthday]);

  return days;
}
