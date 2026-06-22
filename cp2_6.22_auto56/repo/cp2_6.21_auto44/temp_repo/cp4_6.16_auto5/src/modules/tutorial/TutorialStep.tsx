import { useState, useEffect, useRef, useCallback } from 'react';
import { timingService } from '../../services/TimingService';

export interface StepData {
  id: number;
  title: string;
  description: string;
  image: string;
  estimatedTime?: number;
}

interface TutorialStepProps {
  step: StepData;
  stepNumber: number;
  totalSteps: number;
  onStepComplete?: (stepId: number, elapsedSeconds: number) => void;
  onPrev?: () => void;
  onNext?: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
}

export default function TutorialStep({
  step,
  stepNumber,
  totalSteps,
  onStepComplete,
  onPrev,
  onNext,
  canGoPrev,
  canGoNext,
}: TutorialStepProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const syncStateFromService = useCallback(() => {
    const running = timingService.isStepRunning(step.id);
    const elapsed = timingService.getElapsedSeconds(step.id);
    const saved = timingService.getStepTiming(step.id);
    setIsRunning(running);
    setElapsedSeconds(elapsed);
    setCompleted(saved?.completed ?? false);
  }, [step.id]);

  useEffect(() => {
    syncStateFromService();

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [step.id, syncStateFromService]);

  useEffect(() => {
    if (isRunning && !intervalRef.current) {
      intervalRef.current = window.setInterval(() => {
        setElapsedSeconds(timingService.getElapsedSeconds(step.id));
      }, 1000);
    }
    if (!isRunning && intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current && !isRunning) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, step.id]);

  useEffect(() => {
    const activeId = timingService.getActiveStepId();
    if (activeId !== null && activeId !== step.id) {
      if (timingService.isStepRunning(step.id)) {
        timingService.pauseStep(step.id);
        syncStateFromService();
      }
    }
  }, [step.id, syncStateFromService]);

  const handleStart = () => {
    if (isRunning) return;
    timingService.startStep(step.id);
    setIsRunning(true);
  };

  const handlePause = () => {
    if (!isRunning) return;
    const total = timingService.pauseStep(step.id);
    setIsRunning(false);
    setElapsedSeconds(total);
  };

  const handleReset = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    timingService.resetStep(step.id);
    setIsRunning(false);
    setElapsedSeconds(0);
    setCompleted(false);
  };

  const handleComplete = () => {
    if (isRunning) {
      handlePause();
    }
    const finalTime = timingService.completeStep(step.id);
    setCompleted(true);
    setElapsedSeconds(finalTime);
    onStepComplete?.(step.id, finalTime);
  };

  const handleNext = () => {
    if (isRunning) {
      handleComplete();
    } else if (!completed && elapsedSeconds > 0) {
      timingService.completeStep(step.id);
      setCompleted(true);
      onStepComplete?.(step.id, elapsedSeconds);
    }
    onNext?.();
  };

  const formatEstimated = (seconds?: number) => {
    if (!seconds) return '';
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return sec > 0 ? `约${min}分${sec}秒` : `约${min}分钟`;
  };

  return (
    <div className="step-content fade-in" key={step.id}>
      <div className="paper-card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span className="step-number">
            步骤 {stepNumber} / {totalSteps}
          </span>
        </div>

        <h2 className="step-title">{step.title}</h2>

        <img
          src={step.image}
          alt={step.title}
          className="step-image"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=leather%20craft%20workshop%2C%20warm%20wooden%20interior%2C%20tools%20and%20materials&image_size=landscape_4_3';
          }}
        />

        <div className="step-description">{step.description}</div>

        <div className={`timer-panel ${isRunning ? 'timer-running' : ''}`}>
          <span className="timer-label">
            {completed
              ? '✅ 本步已完成'
              : step.estimatedTime
              ? `⏱ 预计用时 ${formatEstimated(step.estimatedTime)}`
              : '⏱ 本步用时'}
          </span>
          <div className="timer-display">
            {timingService.formatTimer(elapsedSeconds)}
          </div>
          <div className="timer-buttons">
            {!isRunning ? (
              <button className="timer-btn" onClick={handleStart}>
                ▶ 开始计时
              </button>
            ) : (
              <button className="timer-btn running" onClick={handlePause}>
                ⏸ 暂停
              </button>
            )}
            <button className="timer-btn" onClick={handleReset} disabled={isRunning}>
              ↺ 重置
            </button>
            {!completed && (
              <button
                className="timer-btn"
                onClick={handleComplete}
                disabled={elapsedSeconds === 0}
              >
                ✓ 标记完成
              </button>
            )}
          </div>
          {completed && elapsedSeconds > 0 && (
            <div className="step-times">
              本步骤花费：{timingService.formatTime(elapsedSeconds)}
            </div>
          )}
        </div>

        <div className="step-nav">
          <button
            className="leather-btn"
            onClick={onPrev}
            disabled={!canGoPrev}
            style={{ visibility: canGoPrev ? 'visible' : 'hidden' }}
          >
            ← 上一步
          </button>
          <button className="leather-btn" onClick={handleNext} disabled={!canGoNext}>
            {stepNumber === totalSteps ? '生成报告 →' : '下一步 →'}
          </button>
        </div>
      </div>
    </div>
  );
}
