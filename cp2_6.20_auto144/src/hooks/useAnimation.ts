import { useState, useEffect, useRef, useCallback } from 'react';

export function usePieceAnimation(
  fromPosition: { row: number; col: number },
  toPosition: { row: number; col: number },
  duration: number = 300
) {
  const [currentPos, setCurrentPos] = useState(fromPosition);
  const [isAnimating, setIsAnimating] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);
  const fromRef = useRef(fromPosition);
  const toRef = useRef(toPosition);

  fromRef.current = fromPosition;
  toRef.current = toPosition;

  const animate = useCallback(
    (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const from = fromRef.current;
      const to = toRef.current;

      setCurrentPos({
        row: from.row + (to.row - from.row) * eased,
        col: from.col + (to.col - from.col) * eased,
      });

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    },
    [duration]
  );

  const start = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    startTimeRef.current = null;
    setCurrentPos(fromRef.current);
    setIsAnimating(true);
    rafRef.current = requestAnimationFrame(animate);
  }, [animate]);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return { currentPos, isAnimating, start };
}

export function useTurnTimer(
  turnStartTime: number,
  onTimeout: () => void,
  isActive: boolean
) {
  const [remainingSeconds, setRemainingSeconds] = useState(30);
  const [isExpired, setIsExpired] = useState(false);
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const calcRemaining = () => {
      const elapsed = Math.floor((Date.now() - turnStartTime) / 1000);
      return Math.max(30 - elapsed, 0);
    };

    const initial = calcRemaining();
    setRemainingSeconds(initial);
    if (initial === 0) {
      setIsExpired(true);
      onTimeoutRef.current();
      return;
    }

    const interval = setInterval(() => {
      const remaining = calcRemaining();
      setRemainingSeconds(remaining);
      if (remaining === 0) {
        setIsExpired(true);
        onTimeoutRef.current();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [turnStartTime, isActive]);

  return { remainingSeconds, isExpired };
}

export function useDiceAnimation(
  isRolling: boolean,
  onRollComplete: () => void
) {
  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const [squeezeScale, setSqueezeScale] = useState(1);
  const rafRef = useRef<number>(0);
  const onRollCompleteRef = useRef(onRollComplete);

  useEffect(() => {
    onRollCompleteRef.current = onRollComplete;
  }, [onRollComplete]);

  useEffect(() => {
    if (!isRolling) return;

    const startTime = performance.now();
    const squeezeDuration = 200;
    const rotationDuration = 700;
    const totalDuration = squeezeDuration + rotationDuration;
    const finalRotationX = 720 + Math.random() * 360 + Math.floor(Math.random() * 2) * 360;
    const finalRotationY = 720 + Math.random() * 360 + Math.floor(Math.random() * 2) * 360;

    const animate = (timestamp: number) => {
      const elapsed = timestamp - startTime;

      if (elapsed < squeezeDuration) {
        const t = elapsed / squeezeDuration;
        if (t < 0.33) {
          setSqueezeScale(1 + (0.8 - 1) * (t / 0.33));
        } else if (t < 0.67) {
          setSqueezeScale(0.8 + (1.2 - 0.8) * ((t - 0.33) / 0.34));
        } else {
          setSqueezeScale(1.2 + (1 - 1.2) * ((t - 0.67) / 0.33));
        }
      } else {
        setSqueezeScale(1);
      }

      if (elapsed >= squeezeDuration) {
        const rotElapsed = elapsed - squeezeDuration;
        const rotProgress = Math.min(rotElapsed / rotationDuration, 1);
        const eased = 1 - Math.pow(1 - rotProgress, 3);
        setRotationX(finalRotationX * eased);
        setRotationY(finalRotationY * eased);
      }

      if (elapsed < totalDuration) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setSqueezeScale(1);
        setRotationX(finalRotationX);
        setRotationY(finalRotationY);
        onRollCompleteRef.current();
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafRef.current);
  }, [isRolling]);

  return { rotationX, rotationY, squeezeScale };
}
