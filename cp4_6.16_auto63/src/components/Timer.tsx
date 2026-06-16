import { useEffect, useRef, useState, useCallback } from 'react';
import type { TimerState } from '../types';
import { useAppStore } from '../store';

interface TimerProps {
  timer: TimerState;
}

let sharedAudioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    if (!sharedAudioContext) {
      sharedAudioContext = new Ctx();
    }
    if (sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume().catch(() => { /* ignore resume errors */ });
    }
    return sharedAudioContext;
  } catch {
    return null;
  }
};

const playCompletionSound = (): Promise<void> => {
  return new Promise((resolve) => {
    const ctx = getAudioContext();
    if (!ctx) {
      resolve();
      return;
    }

    try {
      const now = ctx.currentTime;
      const nodes: OscillatorNode[] = [];
      const gains: GainNode[] = [];

      const playTone = (freq: number, startTime: number, duration: number, delay: number = 0) => {
        const start = startTime + delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.28, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.start(start);
        osc.stop(start + duration + 0.05);
        nodes.push(osc);
        gains.push(gain);
        osc.onended = () => {
          try { osc.disconnect(); } catch { /* noop */ }
          try { gain.disconnect(); } catch { /* noop */ }
        };
      };

      playTone(880, now, 0.16, 0);
      playTone(1174.66, now, 0.26, 0.18);

      const cleanupTimeout = window.setTimeout(() => {
        nodes.forEach(n => { try { n.disconnect(); } catch { /* noop */ } });
        gains.forEach(g => { try { g.disconnect(); } catch { /* noop */ } });
        resolve();
      }, 800);

      let cleaned = false;
      const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        window.clearTimeout(cleanupTimeout);
        nodes.forEach(n => {
          try { n.stop(); } catch { /* noop */ }
          try { n.disconnect(); } catch { /* noop */ }
        });
        gains.forEach(g => { try { g.disconnect(); } catch { /* noop */ } });
      };

      nodes.forEach(n => { n.onended = cleanup; });
    } catch {
      resolve();
    }
  });
};

const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
};

const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  h /= 360; s /= 100; l /= 100;
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255)
  ];
};

const lerpHsl = (c1: [number, number, number], c2: [number, number, number], t: number): [number, number, number] => {
  let dh = c2[0] - c1[0];
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  return [
    (c1[0] + dh * t + 360) % 360,
    c1[1] + (c2[1] - c1[1]) * t,
    c1[2] + (c2[2] - c1[2]) * t
  ];
};

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const GREEN_RGB: [number, number, number] = [16, 185, 129];
const RED_RGB: [number, number, number] = [233, 69, 96];

const Timer = ({ timer }: TimerProps) => {
  const { pauseTimer, resumeTimer, stopTimer, tickTimer } = useAppStore();
  const [showScore, setShowScore] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const stoppedRef = useRef(false);
  const stopInProgressRef = useRef(false);

  useEffect(() => {
    if (!timer.isRunning || timer.isPaused) return;
    const id = window.setInterval(() => {
      tickTimer();
    }, 1000);
    return () => window.clearInterval(id);
  }, [timer.isRunning, timer.isPaused, tickTimer]);

  const handleStop = useCallback(async () => {
    if (stopInProgressRef.current) return;
    stopInProgressRef.current = true;
    try {
      await playCompletionSound();
      const score = Math.floor(timer.elapsedSeconds / 60);
      setFinalScore(score);
      setShowScore(true);
      window.setTimeout(() => {
        setShowScore(false);
        stoppedRef.current = false;
        stopInProgressRef.current = false;
      }, 1500);
      await stopTimer();
    } catch {
      stopInProgressRef.current = false;
    }
  }, [stopTimer, timer.elapsedSeconds]);

  useEffect(() => {
    if (
      timer.totalSeconds > 0 &&
      timer.elapsedSeconds >= timer.totalSeconds &&
      !stoppedRef.current &&
      !stopInProgressRef.current
    ) {
      stoppedRef.current = true;
      void handleStop();
    }
  }, [timer.elapsedSeconds, timer.totalSeconds, handleStop]);

  const progress = timer.totalSeconds > 0
    ? Math.min(1, timer.elapsedSeconds / timer.totalSeconds)
    : 0;

  const greenHsl = rgbToHsl(...GREEN_RGB);
  const redHsl = rgbToHsl(...RED_RGB);
  const hsl = lerpHsl(greenHsl, redHsl, progress);
  const [r, g, b] = hslToRgb(...hsl);
  const gradientColor = `rgb(${r}, ${g}, ${b})`;

  const progressT = Math.max(0, Math.min(1, progress));
  const warnPoint = 0.6;
  const midHsl = progressT < warnPoint
    ? lerpHsl(greenHsl, [48, 95, 60], progressT / warnPoint)
    : lerpHsl([48, 95, 60], redHsl, (progressT - warnPoint) / (1 - warnPoint));
  const [mr, mg, mb] = hslToRgb(...midHsl);
  const midColor = `rgb(${mr}, ${mg}, ${mb})`;
  const startColor = `rgb(${GREEN_RGB[0]}, ${GREEN_RGB[1]}, ${GREEN_RGB[2]})`;

  const remainingSeconds = Math.max(0, timer.totalSeconds - timer.elapsedSeconds);
  const elapsedMinutes = Math.floor(timer.elapsedSeconds / 60);
  const totalMinutes = Math.floor(timer.totalSeconds / 60);

  return (
    <>
      <div
        className={`timer-progress-top ${timer.isRunning ? 'visible' : ''}`}
      >
        <div
          className="progress-fill"
          style={{
            width: `${progress * 100}%`,
            background: gradientColor,
            boxShadow: `0 0 8px ${gradientColor}`
          }}
        />
      </div>

      {timer.isRunning && (
        <div className="modal-overlay">
          <div className="modal-content timer-modal">
            <h3 className="modal-title">专注计时中</h3>
            <p className="modal-subtitle">保持专注，完成你的学习目标！</p>

            <div className="timer-display">
              <div className="timer-countdown" style={{ color: gradientColor, textShadow: `0 0 20px ${gradientColor}66` }}>
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
                    background: `linear-gradient(90deg, ${startColor}, ${midColor}, ${gradientColor})`,
                    boxShadow: `0 0 10px ${gradientColor}80`
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
              <button
                className="timer-btn timer-btn-stop"
                onClick={() => { if (!stopInProgressRef.current) void handleStop(); }}
              >
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
