import { useEffect, useRef, useState } from 'react';
import type { TimerState } from '../types';
import { useAppStore } from '../store';

interface TimerProps {
  timer: TimerState;
  onClose?: () => void;
}

const playCompletionSound = () => {
  try {
    const AudioContext = (window.AudioContext || (window as any).webkitAudioContext);
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    };

    const now = ctx.currentTime;
    playTone(880, now, 0.15);
    playTone(1175, now + 0.18, 0.25);
  } catch (e) {
    console.warn('无法播放提示音', e);
  }
};

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const Timer = ({ timer }: TimerProps) => {
  const { pauseTimer, resumeTimer, stopTimer, tickTimer } = useAppStore();
  const [showScore, setShowScore] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const stoppedRef = useRef(false);

  useEffect(() => {
    if (!timer.isRunning || timer.isPaused) return;
    const id = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(id);
  }, [timer.isRunning, timer.isPaused, tickTimer]);

  useEffect(() => {
    if (timer.totalSeconds > 0 && timer.elapsedSeconds >= timer.totalSeconds && !stoppedRef.current) {
      stoppedRef.current = true;
      handleStop();
    }
  }, [timer.elapsedSeconds, timer.totalSeconds]);

  const progress = timer.totalSeconds > 0
    ? Math.min(1, timer.elapsedSeconds / timer.totalSeconds)
    : 0;

  const green = { r: 16, g: 185, b: 129 };
  const red = { r: 233, g: 69, b: 96 };
  const r = Math.round(green.r + (red.r - green.r) * progress);
  const g = Math.round(green.g + (red.g - green.g) * progress);
  const b = Math.round(green.b + (red.b - green.b) * progress);
  const gradientColor = `rgb(${r}, ${g}, ${b})`;

  const remainingSeconds = Math.max(0, timer.totalSeconds - timer.elapsedSeconds);
  const elapsedMinutes = Math.floor(timer.elapsedSeconds / 60);
  const totalMinutes = Math.floor(timer.totalSeconds / 60);

  const handleStop = async () => {
    playCompletionSound();
    const score = Math.floor(timer.elapsedSeconds / 60);
    setFinalScore(score);
    setShowScore(true);
    setTimeout(() => {
      setShowScore(false);
      stoppedRef.current = false;
    }, 1500);
    await stopTimer();
  };

  return (
    <>
      <div
        className={`timer-progress-top ${timer.isRunning ? 'visible' : ''}`}
      >
        <div
          className="progress-fill"
          style={{
            width: `${progress * 100}%`,
            background: gradientColor
          }}
        />
      </div>

      {timer.isRunning && (
        <div className="modal-overlay">
          <div className="modal-content timer-modal">
            <h3 className="modal-title">专注计时中</h3>
            <p className="modal-subtitle">保持专注，完成你的学习目标！</p>

            <div className="timer-display">
              <div className="timer-countdown" style={{ color: gradientColor }}>
                {formatTime(remainingSeconds)}
              </div>
              <div className="timer-elapsed">
                已专注 <strong>{elapsedMinutes}</strong> / {totalMinutes} 分钟
              </div>

              <div className="timer-progress">
                <div
                  className="timer-progress-fill"
                  style={{
                    width: `${progress * 100}%`,
                    background: `linear-gradient(90deg, rgb(${green.r}, ${green.g}, ${green.b}), ${gradientColor})`
                  }}
                />
              </div>
              <div className="timer-progress-text">
                <span>0%</span>
                <span>{Math.round(progress * 100)}%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="timer-buttons">
              {timer.isPaused ? (
                <button className="timer-btn timer-btn-resume" onClick={resumeTimer}>
                  ▶ 继续
                </button>
              ) : (
                <button className="timer-btn timer-btn-pause" onClick={pauseTimer}>
                  ⏸ 暂停
                </button>
              )}
              <button className="timer-btn timer-btn-stop" onClick={handleStop}>
                ■ 结束
              </button>
            </div>
          </div>
        </div>
      )}

      {showScore && (
        <div className="score-animation">
          <div className="score-popup">+{finalScore} 分钟</div>
        </div>
      )}
    </>
  );
};

export default Timer;
