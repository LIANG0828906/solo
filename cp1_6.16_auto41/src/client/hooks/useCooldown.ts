import { useState, useCallback, useRef, useEffect } from 'react';

export const useCooldown = (cooldownSeconds: number) => {
  const [isCooldown, setIsCooldown] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = useCallback(() => {
    if (isCooldown) return;
    
    setIsCooldown(true);
    setTimeLeft(cooldownSeconds);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setIsCooldown(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [cooldownSeconds, isCooldown]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    isCooldown,
    timeLeft,
    startCooldown,
  };
};
