import { useEffect, useRef, useState } from 'react';

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export function useCountdown(targetTime: string): CountdownResult {
  const [countdown, setCountdown] = useState<CountdownResult>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  const animationRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  useEffect(() => {
    const targetTimestamp = new Date(targetTime).getTime();

    const updateCountdown = (timestamp: number) => {
      if (timestamp - lastTickRef.current >= 1000 || lastTickRef.current === 0) {
        lastTickRef.current = timestamp;

        const now = Date.now();
        const diff = targetTimestamp - now;

        if (diff <= 0) {
          setCountdown({
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            isExpired: true,
          });
          if (animationRef.current !== null) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
          }
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setCountdown({
          days,
          hours,
          minutes,
          seconds,
          isExpired: false,
        });
      }

      animationRef.current = requestAnimationFrame(updateCountdown);
    };

    animationRef.current = requestAnimationFrame(updateCountdown);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [targetTime]);

  return countdown;
}
