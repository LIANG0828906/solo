import { useEffect, useState, useRef, useImperativeHandle, forwardRef } from 'react';

export interface TimerHandle {
  start: () => void;
  stop: () => void;
  reset: () => void;
  getTime: () => number;
}

interface TimerProps {
  isRunning: boolean;
  onTimeUpdate?: (time: number) => void;
}

const Timer = forwardRef<TimerHandle, TimerProps>(({ isRunning, onTimeUpdate }, ref) => {
  const [time, setTime] = useState(0);
  const startTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  useImperativeHandle(ref, () => ({
    start: () => {
      if (!isRunning) {
        startTimeRef.current = performance.now() - accumulatedTimeRef.current;
        tick();
      }
    },
    stop: () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      accumulatedTimeRef.current = time;
    },
    reset: () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setTime(0);
      accumulatedTimeRef.current = 0;
      startTimeRef.current = 0;
    },
    getTime: () => time,
  }));

  const tick = () => {
    const now = performance.now();
    const elapsed = now - startTimeRef.current;
    setTime(elapsed);
    onTimeUpdate?.(elapsed);
    animationFrameRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = performance.now() - accumulatedTimeRef.current;
      tick();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      accumulatedTimeRef.current = time;
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning]);

  const formatTime = (ms: number): string => {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toFixed(1).padStart(4, '0')}`;
  };

  return (
    <div className="timer">
      <span className="timer-icon">⏱</span>
      <span className="timer-value">{formatTime(time)}</span>
    </div>
  );
});

Timer.displayName = 'Timer';

export default Timer;
