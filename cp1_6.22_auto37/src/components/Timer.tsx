import { useState, useEffect, useRef, useCallback } from 'react';
import type { Stage } from '../types';
import { formatTime } from '../utils/helpers';

interface TimerProps {
  stages: Stage[];
  currentStageIndex: number;
  completedStages: { id: string; actualDuration: number }[];
  onStageComplete: (stageIndex: number, actualDuration: number) => void;
  onSpeechComplete: (totalDuration: number) => void;
  onReturn: () => void;
  playTick: () => void;
}

function Timer({
  stages,
  currentStageIndex,
  completedStages,
  onStageComplete,
  onSpeechComplete,
  onReturn,
  playTick,
}: TimerProps) {
  const currentStage = stages[currentStageIndex];
  const totalPlanned = stages.reduce((sum, s) => sum + s.plannedDuration, 0);

  const [isPaused, setIsPaused] = useState(false);
  const [stageElapsed, setStageElapsed] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [displayTime, setDisplayTime] = useState('0:00');
  const [fadeClass, setFadeClass] = useState('');
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [showConfirmNext, setShowConfirmNext] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);

  const lastTickRef = useRef<number>(0);
  const stageCompletedRef = useRef<Set<number>>(new Set());
  const prevDisplaySecRef = useRef<number>(-1);

  const getDisplaySeconds = useCallback(() => {
    if (!currentStage) return 0;
    return Math.max(0, currentStage.plannedDuration - Math.floor(stageElapsed));
  }, [currentStage, stageElapsed]);

  useEffect(() => {
    if (isPaused || !currentStage) return;

    let rafId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      setStageElapsed((prev) => prev + delta);
      setTotalElapsed((prev) => prev + delta);

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPaused, currentStage?.id]);

  useEffect(() => {
    const seconds = getDisplaySeconds();
    const displayStr = formatTime(seconds);

    if (prevDisplaySecRef.current !== seconds && seconds >= 0) {
      setFadeClass('fade-out');
      const timeoutId = setTimeout(() => {
        setDisplayTime(displayStr);
        setFadeClass('');
        playTick();
      }, 80);
      prevDisplaySecRef.current = seconds;
      return () => clearTimeout(timeoutId);
    } else {
      setDisplayTime(displayStr);
    }
  }, [getDisplaySeconds, playTick]);

  useEffect(() => {
    if (!currentStage) return;
    if (stageCompletedRef.current.has(currentStageIndex)) return;

    if (stageElapsed >= currentStage.plannedDuration) {
      stageCompletedRef.current.add(currentStageIndex);
      onStageComplete(currentStageIndex, stageElapsed);
    }
  }, [stageElapsed, currentStage, currentStageIndex, onStageComplete]);

  useEffect(() => {
    const totalRemaining = totalPlanned - totalElapsed;
    if (totalRemaining < -30 && !alertDismissed) {
      setShowAlert(true);
    }
  }, [totalElapsed, totalPlanned, alertDismissed]);

  const handlePreviousStage = () => {
    if (currentStageIndex > 0) {
      stageCompletedRef.current.delete(currentStageIndex - 1);
      onStageComplete(currentStageIndex, stageElapsed);
    }
  };

  const handleNextStage = () => {
    if (currentStageIndex < stages.length - 1) {
      stageCompletedRef.current.add(currentStageIndex);
      onStageComplete(currentStageIndex, stageElapsed);
    }
    setShowConfirmNext(false);
  };

  const handleFinish = () => {
    stageCompletedRef.current.add(currentStageIndex);
    onSpeechComplete(totalElapsed);
    setShowConfirmFinish(false);
  };

  const stageRemaining = currentStage
    ? Math.max(0, currentStage.plannedDuration - stageElapsed)
    : 0;
  const stageProgress = currentStage
    ? Math.min(100, (stageElapsed / currentStage.plannedDuration) * 100)
    : 0;

  const totalRemaining = Math.max(0, totalPlanned - totalElapsed);
  const totalProgress = totalPlanned > 0 ? Math.min(100, (totalElapsed / totalPlanned) * 100) : 0;
  const totalRemainingPercent = 100 - totalProgress;

  const isLastStage = currentStageIndex >= stages.length - 1;

  const progressClass =
    totalRemainingPercent < 10
      ? 'danger'
      : totalRemainingPercent < 25
      ? 'warning'
      : '';

  const numberClass =
    stageRemaining <= 0
      ? 'danger'
      : stageRemaining <= 30
      ? 'warning'
      : '';

  return (
    <div className="timer-container">
      {showAlert && (
        <div className="timer-alert-banner">
          <span>⚠️ 演讲已超时 {formatTime(Math.abs(totalPlanned - totalElapsed))}</span>
          <button className="alert-close-btn" onClick={() => {
            setShowAlert(false);
            setAlertDismissed(true);
          }}>
            知道了
          </button>
        </div>
      )}

      <div className="timer-main">
        <div className="timer-center">
          <div className="timer-top-bar">
            <button
              className="exit-btn"
              onClick={() => setShowConfirmExit(true)}
            >
              ← 退出
            </button>
            <div className="timer-controls">
              <button
                className="control-btn"
                onClick={() => setIsPaused((p) => !p)}
                title={isPaused ? '继续' : '暂停'}
              >
                {isPaused ? '▶' : '⏸'}
              </button>
              <button
                className="control-btn"
                onClick={() => {
                  setStageElapsed(0);
                  setTotalElapsed(0);
                  stageCompletedRef.current.clear();
                }}
                title="重置"
              >
                ↺
              </button>
            </div>
          </div>

          {currentStage && (
            <>
              <div className="current-stage-label">
                第 {currentStageIndex + 1} / {stages.length} 阶段
              </div>
              <h2 className="current-stage-name">{currentStage.name}</h2>
            </>
          )}

          <div
            className="countdown-display"
            style={{ ['--progress' as any]: Math.min(100, stageProgress) }}
          >
            <div className="countdown-ring"></div>
            <div className={`countdown-number ${fadeClass} ${numberClass}`}>
              {displayTime}
            </div>
          </div>

          <div className="timer-progress-container">
            <div className="timer-progress-label">
              <span>总体进度</span>
              <span>
                剩余 {formatTime(totalRemaining)} / 总时长 {formatTime(totalPlanned)}
              </span>
            </div>
            <div className="timer-progress-bar">
              <div
                className={`timer-progress-fill ${progressClass}`}
                style={{ width: `${totalProgress}%` }}
              ></div>
            </div>
          </div>

          <div className="timer-stage-controls">
            <button
              className="btn-stage btn-stage-prev"
              onClick={handlePreviousStage}
              disabled={currentStageIndex === 0 || isPaused}
              style={currentStageIndex === 0 || isPaused ? { opacity: 0.4, pointerEvents: 'none' } : {}}
            >
              ← 上一阶段
            </button>

            {!isLastStage ? (
              <button
                className="btn-stage btn-stage-next"
                onClick={() => setShowConfirmNext(true)}
              >
                下一阶段 →
              </button>
            ) : (
              <button
                className="btn-stage btn-stage-finish"
                onClick={() => setShowConfirmFinish(true)}
              >
                🏁 结束演讲
              </button>
            )}
          </div>
        </div>

        <aside className="timer-sidebar">
          <h3 className="sidebar-title">📑 阶段列表</h3>
          <div className="sidebar-stages">
            {stages.map((stage, idx) => {
              const isActive = idx === currentStageIndex;
              const isCompleted = completedStages.some((c) => c.id === stage.id);
              const actual = completedStages.find((c) => c.id === stage.id)?.actualDuration;

              return (
                <div
                  key={stage.id}
                  className={`sidebar-stage ${isActive ? 'active' : ''} ${
                    isCompleted ? 'completed' : ''
                  }`}
                >
                  <div className="sidebar-stage-header">
                    <span className="sidebar-stage-number">
                      {isCompleted ? '✓' : idx + 1}
                    </span>
                    <div className="sidebar-stage-info">
                      <div className="sidebar-stage-name">{stage.name}</div>
                      <div className="sidebar-stage-duration">
                        {isCompleted && actual !== undefined
                          ? `实际 ${formatTime(actual)} / 计划 ${formatTime(stage.plannedDuration)}`
                          : `计划 ${formatTime(stage.plannedDuration)}`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      {showConfirmExit && (
        <div className="modal-overlay" onClick={() => setShowConfirmExit(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">确认退出？</h3>
            <p className="modal-message">
              退出后当前演讲进度将丢失，且无法生成总结报告。确定要退出吗？
            </p>
            <div className="modal-actions">
              <button
                className="btn-modal-cancel"
                onClick={() => setShowConfirmExit(false)}
              >
                继续演讲
              </button>
              <button
                className="btn-modal-confirm"
                onClick={() => {
                  setShowConfirmExit(false);
                  onReturn();
                }}
              >
                确认退出
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmNext && (
        <div className="modal-overlay" onClick={() => setShowConfirmNext(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">切换到下一阶段？</h3>
            <p className="modal-message">
              当前阶段「{currentStage?.name}」已用时 {formatTime(stageElapsed)}。
              {currentStage && stageElapsed < currentStage.plannedDuration
                ? `（距离计划结束还有 ${formatTime(currentStage.plannedDuration - stageElapsed)}）`
                : ''}
            </p>
            <div className="modal-actions">
              <button
                className="btn-modal-cancel"
                onClick={() => setShowConfirmNext(false)}
              >
                取消
              </button>
              <button
                className="btn-primary"
                style={{
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'none',
                }}
                onClick={handleNextStage}
              >
                下一阶段
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmFinish && (
        <div className="modal-overlay" onClick={() => setShowConfirmFinish(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">确认结束演讲？</h3>
            <p className="modal-message">
              演讲总用时 {formatTime(totalElapsed)}（计划 {formatTime(totalPlanned)}）。
              结束后将自动生成总结报告。
            </p>
            <div className="modal-actions">
              <button
                className="btn-modal-cancel"
                onClick={() => setShowConfirmFinish(false)}
              >
                继续
              </button>
              <button
                className="btn-modal-confirm"
                style={{ background: 'var(--success)' }}
                onClick={handleFinish}
              >
                结束并生成报告
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Timer;
