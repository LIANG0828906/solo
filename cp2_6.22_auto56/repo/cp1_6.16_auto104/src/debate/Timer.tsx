import { useEffect, useRef } from 'react';
import { useDebateStore } from '@/store/debateStore';

interface TimerProps {
  duration?: number;
  onComplete?: () => void;
}

export function Timer({ duration, onComplete }: TimerProps) {
  const { phase, timeRemaining, decrementTime } = useDebateStore();
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(0);

  const isRunning = phase === 'speaking-pro' || phase === 'speaking-con' || phase === 'voting';

  useEffect(() => {
    if (!isRunning) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    accumulatedRef.current = 0;
    lastTimeRef.current = performance.now();

    const tick = (now: number) => {
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;
      accumulatedRef.current += delta;

      if (accumulatedRef.current >= 1000) {
        const secondsToDecrement = Math.floor(accumulatedRef.current / 1000);
        accumulatedRef.current -= secondsToDecrement * 1000;
        
        for (let i = 0; i < secondsToDecrement; i++) {
          decrementTime();
        }
      }

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, decrementTime]);

  useEffect(() => {
    if (timeRemaining <= 0 && isRunning && onComplete) {
      onComplete();
    }
  }, [timeRemaining, isRunning, onComplete]);

  const displayTime = duration ?? timeRemaining;
  const minutes = Math.floor(displayTime / 60);
  const seconds = displayTime % 60;

  const getTimerColor = () => {
    if (phase === 'voting') return '#FFD700';
    const percentage = displayTime / 90;
    if (percentage > 0.5) return '#4ADE80';
    if (percentage > 0.25) return '#FBBF24';
    return '#EF4444';
  };

  const getPhaseLabel = () => {
    switch (phase) {
      case 'speaking-pro': return '正方发言';
      case 'speaking-con': return '反方发言';
      case 'voting': return '投票中';
      case 'finished': return '辩论结束';
      default: return '准备中';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div 
        className="text-sm font-medium mb-2 tracking-wider"
        style={{ color: getTimerColor() }}
      >
        {getPhaseLabel()}
      </div>
      <div
        className="timer-display font-bold tracking-wider"
        style={{
          fontSize: 'clamp(32px, 8vw, 48px)',
          color: getTimerColor(),
          textShadow: `0 0 20px ${getTimerColor()}40`,
        }}
      >
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
      <style>{`
        .timer-display {
          animation: pulse 1s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}
