import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react';
import type { Goal } from '../types';
import { recordsApi, goalsApi } from '../api';
import { formatCountdown, playSoftChime } from '../utils';

interface Props {
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
}

const DURATIONS = [25, 45, 60];

const FocusPage: React.FC<Props> = ({ goals, setGoals }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const goal = useMemo(() => goals.find((g) => g.id === id), [goals, id]);

  const [duration, setDuration] = useState<number>(25);
  const [secondsLeft, setSecondsLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [ripples, setRipples] = useState<number[]>([]);

  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const rippleIdRef = useRef<number>(0);

  const totalSeconds = useMemo<number>(() => duration * 60, [duration]);
  const progress = useMemo<number>(
    () => ((totalSeconds - secondsLeft) / totalSeconds) * 100,
    [totalSeconds, secondsLeft]
  );
  const formattedTime = useMemo<string>(
    () => formatCountdown(secondsLeft),
    [secondsLeft]
  );
  const strokeDasharray = useMemo<number>(() => 2 * Math.PI * 120, []);
  const strokeDashoffset = useMemo<number>(
    () => strokeDasharray * (1 - progress / 100),
    [strokeDasharray, progress]
  );

  const handleFinish = useCallback(async () => {
    setIsRunning(false);
    setIsFinished(true);
    playSoftChime();

    const newRippleId = rippleIdRef.current++;
    setRipples((prev) => [...prev, newRippleId]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((rid) => rid !== newRippleId));
    }, 2000);

    if (goal && startTimeRef.current) {
      try {
        await recordsApi.create({
          goalId: goal.id,
          startTime: startTimeRef.current.toISOString(),
          endTime: new Date().toISOString(),
          durationMinutes: duration,
          note: '专注模式学习',
        });
        const goalsData = await goalsApi.getAll();
        setGoals(goalsData);
      } catch (e) {
        // empty
      }
    }
  }, [goal, duration, setGoals]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          handleFinish();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, handleFinish]);

  const toggleTimer = useCallback(() => {
    if (!isRunning && !isFinished) {
      startTimeRef.current = startTimeRef.current || new Date();
    }
    setIsRunning((r) => !r);
  }, [isRunning, isFinished]);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setIsFinished(false);
    setSecondsLeft(duration * 60);
    startTimeRef.current = null;
  }, [duration]);

  const changeDuration = useCallback(
    (mins: number) => {
      if (isRunning) return;
      setDuration(mins);
      setSecondsLeft(mins * 60);
      setIsFinished(false);
      startTimeRef.current = null;
    },
    [isRunning]
  );

  const handleBack = useCallback(() => {
    if (goal) {
      navigate(`/goal/${goal.id}`);
    }
  }, [navigate, goal]);

  if (!goal) {
    return (
      <div className="focus-wrap">
        <div className="focus-container">
          <p style={{ color: 'white' }}>目标不存在</p>
        </div>
        <style>{`
          .focus-wrap {
            position: fixed;
            inset: 0;
            background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%);
            color: white;
            overflow: hidden;
            z-index: 50;
          }
          .focus-container {
            position: relative;
            z-index: 1;
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 24px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="focus-wrap">
      <div className="focus-container">
        <button className="focus-back" onClick={handleBack}>
          <ArrowLeft size={20} />
          返回
        </button>

        <div className="focus-goal">{goal.name}</div>

        <div className="focus-sub">专注模式</div>

        <div className="timer-wrap">
          {ripples.map((rid) => (
            <div key={rid} className="ripple ripple-1" />
          ))}
          {ripples.map((rid) => (
            <div key={`${rid}-2`} className="ripple ripple-2" />
          ))}
          {ripples.map((rid) => (
            <div key={`${rid}-3`} className="ripple ripple-3" />
          ))}
          <div className="timer-ring">
            <svg width="280" height="280" viewBox="0 0 280 280">
              <defs>
                <linearGradient id="focusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#667eea" />
                </linearGradient>
              </defs>
              <circle
                cx="140"
                cy="140"
                r="120"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="140"
                cy="140"
                r="120"
                stroke="url(#focusGrad)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                style={{
                  transform: 'rotate(-90deg)',
                  transformOrigin: '140px 140px',
                  transition: 'stroke-dashoffset 0.5s ease',
                }}
              />
            </svg>
            <div className="timer-text">
              <div className="timer-digits">{formattedTime}</div>
              <div className="timer-label">
                {isFinished ? '专注完成 🎉' : isRunning ? '专注中...' : '准备开始'}
              </div>
            </div>
          </div>
        </div>

        <div className="duration-selector">
          {DURATIONS.map((d) => (
            <button
              key={d}
              className={`duration-btn ${duration === d ? 'active' : ''}`}
              onClick={() => changeDuration(d)}
              disabled={isRunning}
            >
              {d} 分钟
            </button>
          ))}
        </div>

        <div className="focus-actions">
          <button className="focus-btn secondary" onClick={resetTimer}>
            <RotateCcw size={20} />
            重置
          </button>
          <button
            className={`focus-btn primary ${isFinished ? 'finished' : ''}`}
            onClick={toggleTimer}
            disabled={isFinished}
          >
            {isRunning ? <Pause size={24} /> : <Play size={24} />}
            {isFinished ? '已完成' : isRunning ? '暂停' : '开始'}
          </button>
        </div>
      </div>

      <style>{`
        .focus-wrap {
          position: fixed;
          inset: 0;
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%);
          color: white;
          overflow: hidden;
          z-index: 50;
        }
        .focus-wrap::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 20% 30%, rgba(167, 139, 250, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(102, 126, 234, 0.25) 0%, transparent 50%);
          pointer-events: none;
        }
        .focus-container {
          position: relative;
          z-index: 1;
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          animation: fadeIn 0.6s ease;
        }
        .focus-back {
          position: absolute;
          top: 24px;
          left: 24px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: