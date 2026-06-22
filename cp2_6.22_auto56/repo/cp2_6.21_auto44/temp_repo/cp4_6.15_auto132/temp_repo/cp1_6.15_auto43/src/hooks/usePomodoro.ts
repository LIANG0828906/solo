import { useCallback, useEffect, useRef, useState } from 'react';
import type { PomodoroRecord } from '../types';
import { POMODORO_DURATION } from '../types';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export function usePomodoro(
  taskId: string | null,
  onComplete: (record: PomodoroRecord) => void
) {
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [remaining, setRemaining] = useState(POMODORO_DURATION);
  const [isFlashing, setIsFlashing] = useState(false);

  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const baseRemainingRef = useRef<number>(POMODORO_DURATION);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    setRemaining(POMODORO_DURATION);
    setStatus('idle');
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, [taskId]);

  const tick = useCallback(() => {
    const elapsed = performance.now() - startTimeRef.current;
    const newRemaining = Math.max(0, baseRemainingRef.current - elapsed);
    setRemaining(newRemaining);

    if (newRemaining <= 0) {
      rafRef.current = null;
      setStatus('completed');
      setIsFlashing(true);

      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.frequency.value = 880;
        oscillator.type = 'sine';
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
      } catch (e) {
        console.warn('Audio playback failed:', e);
      }

      if (taskId) {
        const record: PomodoroRecord = {
          id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          taskId,
          completedAt: new Date().toISOString(),
          duration: 25,
        };
        onComplete(record);
      }

      setTimeout(() => {
        setIsFlashing(false);
      }, 5000);

      return;
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [taskId, onComplete]);

  const start = useCallback(() => {
    if (!taskId || status === 'running') return;
    startTimeRef.current = performance.now();
    baseRemainingRef.current = status === 'paused' ? remaining : POMODORO_DURATION;
    if (status === 'idle' || status === 'completed') {
      baseRemainingRef.current = POMODORO_DURATION;
      setRemaining(POMODORO_DURATION);
    }
    setStatus('running');
    rafRef.current = requestAnimationFrame(tick);
  }, [taskId, status, remaining, tick]);

  const pause = useCallback(() => {
    if (status !== 'running') return;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const elapsed = performance.now() - startTimeRef.current;
    baseRemainingRef.current = Math.max(0, baseRemainingRef.current - elapsed);
    setRemaining(baseRemainingRef.current);
    setStatus('paused');
  }, [status]);

  const reset = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setRemaining(POMODORO_DURATION);
    setStatus('idle');
    setIsFlashing(false);
    baseRemainingRef.current = POMODORO_DURATION;
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const progress = 1 - remaining / POMODORO_DURATION;
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return {
    status,
    remaining,
    progress,
    minutes,
    seconds,
    isFlashing,
    start,
    pause,
    reset,
  };
}
