import React, { useEffect, useRef, useCallback, useState } from 'react';
import type { Recipe, TimerState, Step } from '../types';

interface TimerDashboardProps {
  recipe: Recipe;
  timerState: TimerState | null;
  onTimerUpdate: (state: TimerState) => void;
  onStart: () => void;
  onPause: () => void;
  onSkip: () => void;
  onReset: () => void;
  syncTimer: (state: TimerState) => void;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const interpolateColor = (color1: number[], color2: number[], ratio: number): string => {
  const r = Math.round(color1[0] + (color2[0] - color1[0]) * ratio);
  const g = Math.round(color1[1] + (color2[1] - color1[1]) * ratio);
  const b = Math.round(color1[2] + (color2[2] - color1[2]) * ratio);
  return `rgb(${r}, ${g}, ${b})`;
};

const hexToRgb = (hex: string): number[] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
};

const getProgressColor = (percentage: number): string => {
  const green = hexToRgb('#4CAF50');
  const yellow = hexToRgb('#FFC107');
  const orange = hexToRgb('#FF9800');
  const red = hexToRgb('#E53935');

  if (percentage >= 70) {
    const ratio = (100 - percentage) / 30;
    return interpolateColor(green, yellow, ratio);
  } else if (percentage >= 40) {
    const ratio = (70 - percentage) / 30;
    return interpolateColor(yellow, orange, ratio);
  } else {
    const ratio = (40 - percentage) / 40;
    return interpolateColor(orange, red, ratio);
  }
};

const TimerDashboard: React.FC<TimerDashboardProps> = ({
  recipe,
  timerState,
  onTimerUpdate,
  onStart,
  onPause,
  onSkip,
  onReset,
  syncTimer,
}) => {
  const timerRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(performance.now());
  const [circleSize, setCircleSize] = useState(200);

  useEffect(() => {
    const handleResize = () => {
      setCircleSize(window.innerWidth < 768 ? 150 : 200);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentStep: Step | undefined = recipe.steps[timerState?.currentStepIndex ?? 0];
  const totalDuration = currentStep?.duration ?? 0;
  const remainingTime = timerState?.remainingTime ?? 0;
  const percentage = totalDuration > 0 ? (remainingTime / totalDuration) * 100 : 0;
  const isLowTime = percentage <= 20 && remainingTime > 0;

  const strokeWidth = 12;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const tick = useCallback(() => {
    if (!timerState || !timerState.isRunning) return;

    const now = performance.now();
    const delta = (now - lastTickRef.current) / 1000;
    lastTickRef.current = now;

    const newRemainingTime = Math.max(0, timerState.remainingTime - delta);
    const newState: TimerState = {
      ...timerState,
      remainingTime: newRemainingTime,
      lastUpdated: Date.now(),
    };

    if (newRemainingTime <= 0) {
      const nextIndex = timerState.currentStepIndex + 1;
      if (nextIndex < recipe.steps.length) {
        const nextStep = recipe.steps[nextIndex];
        newState.currentStepIndex = nextIndex;
        newState.remainingTime = nextStep.duration;
        newState.completedSteps = [...timerState.completedSteps, currentStep?.id ?? ''];
      } else {
        newState.isRunning = false;
        newState.completedSteps = [...timerState.completedSteps, currentStep?.id ?? ''];
      }
    }

    onTimerUpdate(newState);
  }, [timerState, recipe.steps, currentStep?.id, onTimerUpdate]);

  useEffect(() => {
    if (timerState?.isRunning) {
      lastTickRef.current = performance.now();
      timerRef.current = window.setInterval(tick, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerState?.isRunning, tick]);

  useEffect(() => {
    if (timerState && timerState.lastUpdated > 0) {
      const syncInterval = setInterval(() => {
        syncTimer(timerState);
      }, 800);

      return () => clearInterval(syncInterval);
    }
  }, [timerState, syncTimer]);

  const handleStart = () => {
    lastTickRef.current = performance.now();
    onStart();
  };

  if (!timerState) {
    return (
      <div className="timer-section">
        <button className="btn btn-accent" onClick={onStart}>
          🍳 开始烹饪
        </button>
      </div>
    );
  }

  const isCompleted = timerState.completedSteps.length === recipe.steps.length;

  return (
    <div className="timer-section">
      {isCompleted ? (
        <div className="text-center">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ color: '#4CAF50', marginBottom: '16px' }}>烹饪完成！</h2>
          <button className="btn btn-secondary" onClick={onReset}>
            重新开始
          </button>
        </div>
      ) : (
        <>
          <div className="timer-circle">
            <svg width={circleSize} height={circleSize}>
              <circle
                cx={circleSize / 2}
                cy={circleSize / 2}
                r={radius}
                fill="none"
                stroke="#EFEBE9"
                strokeWidth={strokeWidth}
              />
              <circle
                cx={circleSize / 2}
                cy={circleSize / 2}
                r={radius}
                fill="none"
                stroke={getProgressColor(percentage)}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className={`progress-ring ${isLowTime ? 'blinking' : ''}`}
              />
            </svg>
            <div className="timer-display">
              <div className="timer-time">{formatTime(remainingTime)}</div>
              <div className="timer-step">
                步骤 {timerState.currentStepIndex + 1} / {recipe.steps.length}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <h3 style={{ color: '#4E342E', marginBottom: '8px' }}>
              {currentStep?.description}
            </h3>
          </div>

          <div className="timer-controls">
            {timerState.isRunning ? (
              <button className="btn btn-secondary" onClick={onPause}>
                ⏸️ 暂停
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleStart}>
                ▶️ 继续
              </button>
            )}
            <button className="btn btn-secondary" onClick={onSkip}>
              ⏭️ 跳过
            </button>
            <button className="btn btn-secondary" onClick={onReset}>
              🔄 重置
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default TimerDashboard;
