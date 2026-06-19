import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Square, Coffee } from 'lucide-react';
import { useStore, useTaskStore } from '@/store';
import { addRecord, PomodoroRecord } from '@/utils/storage';

const WORK_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;
const CIRCLE_SIZE = 300;
const STROKE_WIDTH = 4;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH * 2) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  curl: number;
}

const PARTICLE_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e'];

function lerpColor(ratio: number): string {
  const stops = [
    { t: 0.0, r: 239, g: 68, b: 68 },
    { t: 0.5, r: 249, g: 115, b: 22 },
    { t: 1.0, r: 34, g: 197, b: 94 },
  ];
  let a = stops[0];
  let b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (ratio >= stops[i].t && ratio <= stops[i + 1].t) {
      a = stops[i];
      b = stops[i + 1];
      break;
    }
  }
  const range = b.t - a.t;
  const localT = range === 0 ? 0 : (ratio - a.t) / range;
  const r = Math.round(a.r + (b.r - a.r) * localT);
  const g = Math.round(a.g + (b.g - a.g) * localT);
  const bl = Math.round(a.b + (b.b - a.b) * localT);
  return `rgb(${r}, ${g}, ${bl})`;
}

interface TimerProps {
  onTaskMissing?: () => void;
}

export default function Timer({ onTaskMissing }: TimerProps) {
  const { todayPomodoros, currentSession, isBreak, addPomodoro, setIsRunning, setIsBreak } = useStore();
  const { input } = useTaskStore();

  const [timeLeft, setTimeLeft] = useState(isBreak ? BREAK_DURATION : WORK_DURATION);
  const [phase, setPhase] = useState<'idle' | 'running' | 'finished'>('idle');
  const [showPulse, setShowPulse] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [buttonFading, setButtonFading] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const totalDuration = isBreak ? BREAK_DURATION : WORK_DURATION;
  const progress = 1 - timeLeft / totalDuration;

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const playChordSound = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;
      const duration = 0.3;

      const freqs = [880, 1318.51];

      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const vol = 0.18 - i * 0.03;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + duration + 0.02);
      });
    } catch {
      /* ignore audio errors */
    }
  }, []);

  const spawnParticles = useCallback(() => {
    setShowParticles(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const count = 32 + Math.floor(Math.random() * 9);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    particlesRef.current = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      return {
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 0.9 + Math.random() * 0.7,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        size: 2 + Math.random() * 3,
        curl: (Math.random() - 0.5) * 0.25,
      };
    });

    let elapsed = 0;
    const step = () => {
      elapsed += 1 / 60;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const alive: Particle[] = [];
      for (const p of particlesRef.current) {
        const angle = p.curl * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const nvx = p.vx * cos - p.vy * sin;
        const nvy = p.vx * sin + p.vy * cos;
        p.vx = nvx;
        p.vy = nvy;

        p.vy += 0.015;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1 / (60 * p.maxLife);

        if (p.life > 0) {
          alive.push(p);
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * Math.max(0.3, p.life), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      particlesRef.current = alive;

      if (alive.length > 0 && elapsed < 2.5) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setTimeout(() => setShowParticles(false), 400);
      }
    };
    rafRef.current = requestAnimationFrame(step);
  }, []);

  const finishPomodoro = useCallback(async () => {
    stopInterval();
    setPhase('finished');
    playChordSound();
    spawnParticles();
    setShowPulse(true);
    setTimeout(() => setShowPulse(false), 500);

    if (!isBreak) {
      const record: Omit<PomodoroRecord, 'id'> = {
        taskName: input.taskName || '未命名任务',
        taskDescription: input.taskDescription,
        taskType: input.taskType,
        duration: WORK_DURATION / 60,
        moodScore: input.moodScore,
        completedAt: new Date().toISOString(),
        index: todayPomodoros.length + 1,
      };
      const saved = await addRecord(record);
      addPomodoro(saved);
    }

    setTimeout(() => {
      setIsRunning(false);
    }, 1200);
  }, [isBreak, input, todayPomodoros.length, addPomodoro, stopInterval, playChordSound, spawnParticles, setIsRunning]);

  const handleStart = () => {
    if (!input.taskName.trim() && !isBreak) {
      onTaskMissing?.();
      return;
    }
    setButtonFading(true);
    setTimeout(() => {
      setPhase('running');
      setIsRunning(true);
      setButtonFading(false);

      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopInterval();
            finishPomodoro();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 320);
  };

  const handleReset = () => {
    stopInterval();
    setPhase('idle');
    setIsRunning(false);
    setTimeLeft(isBreak ? BREAK_DURATION : WORK_DURATION);
  };

  const handleSwitchMode = (nextBreak: boolean) => {
    stopInterval();
    setIsBreak(nextBreak);
    setPhase('idle');
    setTimeLeft(nextBreak ? BREAK_DURATION : WORK_DURATION);
  };

  useEffect(() => {
    if (phase === 'idle') {
      setTimeLeft(isBreak ? BREAK_DURATION : WORK_DURATION);
    }
  }, [isBreak, phase]);

  useEffect(() => {
    return () => {
      stopInterval();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [stopInterval]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const displayTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const arcColor = lerpColor(progress);

  const session = !isBreak ? currentSession : '休息';

  return (
    <div className="flex flex-col items-center gap-6 select-none">
      <div
        className="relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <svg
          width={CIRCLE_SIZE}
          height={CIRCLE_SIZE}
          className="drop-shadow-[0_0_20px_rgba(129,140,248,0.25)]"
        >
          <defs>
            <radialGradient id="innerBg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(51, 44, 110, 0.9)" />
              <stop offset="100%" stopColor="rgba(24, 20, 62, 0.95)" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={RADIUS}
            fill="url(#innerBg)"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={STROKE_WIDTH}
          />

          <circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={arcColor}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
            filter="url(#glow)"
            style={{ transition: 'stroke 0.5s ease, stroke-dashoffset 0.35s linear' }}
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div
              className={`font-mono text-[48px] leading-none text-white tracking-wider ${showPulse ? 'number-pulse' : ''}`}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {displayTime}
            </div>
            <div className="mt-4 text-xs text-slate-400 tracking-widest uppercase">
              {isBreak ? 'Rest Break' : 'Focus Time'}
            </div>
          </div>
        </div>

        {hovered && phase !== 'idle' && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 glass-card px-3 py-1.5 rounded-full text-sm text-white slide-in-right whitespace-nowrap">
            {isBreak ? '☕ 休息时间' : `🍅 第 ${session} 个番茄钟`}
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={CIRCLE_SIZE}
          height={CIRCLE_SIZE}
          className={`absolute inset-0 pointer-events-none ${showParticles ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
        />
      </div>

      <div className="flex items-center gap-3 h-12">
        {phase === 'idle' && !buttonFading && (
          <button
            onClick={handleStart}
            className={`group flex items-center gap-2 px-8 py-3 rounded-full font-medium text-white shadow-lg transition-all duration-200 ${
              isBreak
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400'
            } hover:scale-105 active:scale-95 fade-scale-in`}
          >
            <Play size={18} fill="currentColor" />
            {isBreak ? '开始休息' : '开始专注'}
          </button>
        )}

        {buttonFading && (
          <div className="flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 fade-scale-out opacity-0 pointer-events-none">
            <Play size={18} fill="currentColor" />
            {isBreak ? '开始休息' : '开始专注'}
          </div>
        )}

        {phase === 'running' && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 rounded-full glass text-white hover:bg-white/10 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Square size={16} fill="currentColor" />
            停止
          </button>
        )}

        {phase === 'finished' && (
          <div className="flex items-center gap-3 fade-scale-in">
            <button
              onClick={() => handleSwitchMode(false)}
              className={`flex items-center gap-2 px-5 py-3 rounded-full font-medium text-white shadow-lg transition-all duration-200 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 hover:scale-105 active:scale-95`}
            >
              <Play size={16} fill="currentColor" />
              继续工作
            </button>
            <button
              onClick={() => handleSwitchMode(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-full glass text-white hover:bg-white/10 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Coffee size={16} />
              休息一下
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-400">
        <button
          onClick={() => handleSwitchMode(false)}
          className={`px-4 py-1.5 rounded-full transition-all duration-200 ${!isBreak ? 'bg-white/15 text-white' : 'hover:bg-white/10'}`}
        >
          🍅 工作模式
        </button>
        <button
          onClick={() => handleSwitchMode(true)}
          className={`px-4 py-1.5 rounded-full transition-all duration-200 ${isBreak ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/30' : 'hover:bg-white/10'}`}
        >
          ☕ 休息模式
        </button>
        <span className="ml-3 px-3 py-1 rounded-full glass text-xs">
          今日完成 {todayPomodoros.length} 个番茄钟
        </span>
        <span className="px-3 py-1 rounded-full glass text-xs">
          累计 {todayPomodoros.length * 25} 分钟
        </span>
      </div>
    </div>
  );
}
