import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Play, Pause, SkipForward, ChevronLeft, ChevronRight,
  Dumbbell, Clock, Flame, Check, AlertCircle
} from 'lucide-react';
import type { Session, SelfAssessment, Exercise, PlanDay } from '../../../../shared/types';

function playChime(type: 'rest' | 'complete' = 'rest') {
  try {
    const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'rest') {
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.15);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.3, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
    setTimeout(() => ctx.close(), 500);
  } catch { /* ignore audio errors */ }
}

interface SetButtonProps {
  completed: boolean;
  setNumber: number;
  onComplete: () => void;
  disabled?: boolean;
}

function SetButton({ completed, setNumber, onComplete, disabled }: SetButtonProps) {
  const [showCheck, setShowCheck] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const handleClick = () => {
    if (completed || disabled) return;
    setJustCompleted(true);
    setShowCheck(true);
    setTimeout(() => onComplete(), 350);
  };

  return (
    <button
      onClick={handleClick}
      disabled={completed || disabled}
      className={`relative w-14 h-14 rounded-xl font-bold text-lg transition-all duration-300 ease-out overflow-hidden select-none ${
        completed
          ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
          : disabled
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'btn-primary text-white hover:scale-105'
      }`}
    >
      {completed || justCompleted ? (
        <>
          <span className={`absolute left-1/2 top-1/2 ${justCompleted ? 'animate-checkmark' : ''}`}>
            <Check size={22} strokeWidth={3} />
          </span>
        </>
      ) : (
        <span className="relative z-10">{setNumber}</span>
      )}
    </button>
  );
}

interface CountdownRingProps {
  seconds: number;
  totalSeconds: number;
  onSkip: () => void;
  onPause: () => void;
  isPaused: boolean;
}

function CountdownRing({ seconds, totalSeconds, onSkip, onPause, isPaused }: CountdownRingProps) {
  const size = 180;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = 1 - seconds / totalSeconds;
  const strokeDashoffset = circumference * (1 - progress);
  const lowTime = seconds <= 10;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-3xl p-8 shadow-2xl animate-fade-in max-w-sm w-full mx-4">
        <h3 className="text-center text-lg font-semibold text-gray-700 mb-6">
          {isPaused ? '⏸ 已暂停' : '💪 组间休息'}
        </h3>

        <div className="flex justify-center mb-6">
          <div className={`relative ${lowTime && !isPaused ? 'animate-ring-pulse' : ''}`}>
            <svg width={size} height={size} className="-rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#f1f5f9"
                strokeWidth={strokeWidth}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={lowTime ? '#ef4444' : 'url(#ringGradient)'}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.3s' }}
              />
              <defs>
                <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FF6B35" />
                  <stop offset="100%" stopColor="#FF8C42" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold bg-gradient-to-br from-orange-500 to-amber-400 bg-clip-text text-transparent">
                {seconds}
              </span>
              <span className="text-sm text-gray-400 mt-1">秒</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onPause}
            className="btn-ghost"
          >
            {isPaused ? <Play size={18} /> : <Pause size={18} />}
            {isPaused ? '继续' : '暂停'}
          </button>
          <button
            onClick={onSkip}
            className="btn-primary"
          >
            <SkipForward size={18} />
            跳过休息
          </button>
        </div>
      </div>
    </div>
  );
}

interface TrainingSummaryProps {
  duration: number;
  completedExercises: number;
  totalExercises: number;
  calories: number;
  onClose: () => void;
}

function TrainingSummary({ duration, completedExercises, totalExercises, calories, onClose }: TrainingSummaryProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mb-4 shadow-lg shadow-green-500/30">
            <Check size={32} className="text-white" strokeWidth={3} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">🎉 训练完成！</h2>
          <p className="text-gray-500 mt-2">做得真棒，继续保持！</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="card text-center p-4 m-0!">
            <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">{duration}</div>
            <div className="text-xs text-gray-500">分钟</div>
          </div>
          <div className="card text-center p-4 m-0!">
            <Dumbbell className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">{completedExercises}/{totalExercises}</div>
            <div className="text-xs text-gray-500">完成动作</div>
          </div>
          <div className="card text-center p-4 m-0!">
            <Flame className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">{calories}</div>
            <div className="text-xs text-gray-500">kcal</div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="btn-primary w-full py-3 text-base"
        >
          返回首页
        </button>
      </div>
    </div>
  );
}

export default function DailySession() {
  const { clientId } = useParams<{ clientId?: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [planDay, setPlanDay] = useState<PlanDay | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState<Record<string, boolean[]>>({});
  const [countdown, setCountdown] = useState<{ active: boolean; total: number; current: number; paused: boolean }>({ active: false, total: 60, current: 60, paused: false });
  const [showSummary, setShowSummary] = useState(false);
  const [startTime] = useState<number>(Date.now());
  const [selfAssessment, setSelfAssessment] = useState<SelfAssessment | null>(null);
  const [adjustmentNotes, setAdjustmentNotes] = useState<string[]>([]);
  const countdownRef = useRef<number | null>(null);

  const DEFAULT_CLIENT_ID = 'client-1';
  const actualClientId = clientId ?? DEFAULT_CLIENT_ID;

  const fetchTodaySession = useCallback(async () => {
    try {
      const [sessionRes, planRes, exRes, assessRes] = await Promise.all([
        axios.get<Session>(`/api/sessions/client/${actualClientId}/today`).catch(() => null),
        axios.get(`/api/trainingPlans/${actualClientId}`).catch(() => null),
        axios.get<Exercise[]>('/api/exercises'),
        axios.get(`/api/sessions/client/${actualClientId}/today/assessment`).catch(() => null),
      ]);
      if (exRes?.data) setExercises(exRes.data);

      let planDayData: PlanDay | null = null;
      if (planRes?.data?.days) {
        const todayIndex = ((new Date().getDay() + 6) % 7);
        planDayData = planRes.data.days.find((d: PlanDay) => d.dayIndex === todayIndex) ?? planRes.data.days[0] ?? null;
        setPlanDay(planDayData);
      }

      if (assessRes?.data) {
        setSelfAssessment(assessRes.data.selfAssessment);
        if (assessRes.data.modificationNotes) {
          setAdjustmentNotes(assessRes.data.modificationNotes);
        }
      }

      const sessionData = sessionRes?.data;
      if (sessionData) {
        setSession(sessionData);
      } else if (planDayData) {
        const initialCompleted: Record<string, boolean[]> = {};
        planDayData.exercises.forEach(e => {
          initialCompleted[e.exerciseId] = Array(e.sets).fill(false);
        });
        setCompletedSets(initialCompleted);
      }
    } catch { /* ignore */ }
  }, [actualClientId]);

  useEffect(() => {
    fetchTodaySession();
  }, [fetchTodaySession]);

  useEffect(() => {
    if (countdown.active && !countdown.paused) {
      countdownRef.current = window.setInterval(() => {
        setCountdown(prev => {
          if (prev.current <= 1) {
            playChime('rest');
            if (countdownRef.current) clearInterval(countdownRef.current);
            return { ...prev, active: false, current: 0 };
          }
          return { ...prev, current: prev.current - 1 };
        });
      }, 1000);
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [countdown.active, countdown.paused]);

  const dayExercises = useMemo(() => {
    if (!planDay) return [];
    return planDay.exercises.sort((a, b) => a.order - b.order).map(pe => {
      const ex = exercises.find(e => e.id === pe.exerciseId);
      return { ...pe, name: ex?.name ?? '未知', muscleGroup: ex?.muscleGroup ?? '', difficulty: ex?.difficulty ?? 1 };
    });
  }, [planDay, exercises]);

  const currentExercise = dayExercises[currentExIndex];

  const handleSetComplete = (setIdx: number) => {
    if (!currentExercise) return;
    const exId = currentExercise.exerciseId;
    setCompletedSets(prev => {
      const newSets = { ...prev, [exId]: [...(prev[exId] || [])] };
      newSets[exId][setIdx] = true;
      return newSets;
    });

    const allSetsForEx = Array(currentExercise.sets).fill(false).map((_, i) => i <= setIdx ? true : completedSets[exId]?.[i] ?? false);
    const allSetsDone = allSetsForEx.every(Boolean) || setIdx === currentExercise.sets - 1;

    if (allSetsDone) {
      playChime('complete');
    }

    if (setIdx < currentExercise.sets - 1) {
      setCountdown({ active: true, total: currentExercise.restSeconds, current: currentExercise.restSeconds, paused: false });
    }
  };

  const allSetsDoneForCurrent = currentExercise
    ? (completedSets[currentExercise.exerciseId] ?? []).every(Boolean)
    : false;

  const goToNextExercise = () => {
    setCountdown(prev => ({ ...prev, active: false }));
    if (currentExIndex < dayExercises.length - 1) {
      setCurrentExIndex(i => i + 1);
    } else {
      const totalDuration = Math.round((Date.now() - startTime) / 60000);
      let totalCalories = 0;
      dayExercises.forEach(ex => {
        totalCalories += ex.sets * (ex.difficulty >= 3 ? 8 : 5);
      });
      const totalDone = dayExercises.filter(ex => (completedSets[ex.exerciseId] ?? []).every(Boolean)).length;
      setShowSummary(true);
      axios.post('/api/sessions', {
        planId: planDay ? 'plan-1' : null,
        clientId: actualClientId,
        date: new Date().toISOString(),
        dayIndex: planDay?.dayIndex ?? 0,
        completedExercises: Object.entries(completedSets).map(([eId, sets]) => ({
          exerciseId: eId,
          completedSets: sets.filter(Boolean).length,
          completedReps: sets.map(s => s ? 10 : 0),
          completedAt: new Date().toISOString(),
        })),
        selfAssessment,
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        totalDuration,
      }).catch(() => {});
      (window as any)._summaryData = { duration: totalDuration, completed: totalDone, total: dayExercises.length, calories: totalCalories };
    }
  };

  const summaryData = (window as any)._summaryData;

  if (!planDay || dayExercises.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="card text-center py-16 animate-fade-in">
          <Dumbbell size={56} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">今天无训练安排</h2>
          <p className="text-gray-500 mb-6">您可以先完成今日自评，或为明天做准备</p>
          <button
            className="btn-primary"
            onClick={fetchTodaySession}
          >
            刷新
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 pb-32">
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-gray-800">🔥 今日训练</h1>
        <span className="badge badge-orange text-sm">
          {currentExIndex + 1} / {dayExercises.length}
        </span>
      </div>

      <div className="w-full h-2 bg-gray-200 rounded-full mb-6 overflow-hidden animate-fade-in-delay-1">
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${((currentExIndex + (allSetsDoneForCurrent ? 1 : 0)) / dayExercises.length) * 100}%` }}
        />
      </div>

      {adjustmentNotes.length > 0 && (
        <div className="card border-l-4 border-amber-400 mb-6 animate-fade-in-delay-1">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-700 mb-2">基于今日自评已调整训练</h4>
              <ul className="space-y-1 text-sm text-amber-600">
                {adjustmentNotes.map((note, i) => <li key={i}>• {note}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="card animate-fade-in-delay-2" key={currentExercise?.exerciseId}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-xl font-bold text-gray-800">{currentExercise?.name}</h2>
              <span className="badge badge-blue">{currentExercise?.muscleGroup}</span>
            </div>
            <p className="text-sm text-gray-500">
              目标：{currentExercise?.sets}组 × {currentExercise?.reps}次 · 组间休息 {currentExercise?.restSeconds}秒
            </p>
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < (currentExercise?.difficulty ?? 1) ? 'bg-orange-500' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-600 mb-3">✓ 点击打卡完成每组</h3>
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: currentExercise?.sets ?? 0 }).map((_, idx) => (
              <SetButton
                key={idx}
                setNumber={idx + 1}
                completed={completedSets[currentExercise?.exerciseId ?? '']?.[idx] ?? false}
                onComplete={() => handleSetComplete(idx)}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-100">
          <button
            className="btn-ghost"
            disabled={currentExIndex === 0}
            onClick={() => setCurrentExIndex(i => Math.max(0, i - 1))}
          >
            <ChevronLeft size={18} /> 上一个
          </button>
          <button
            className={`${allSetsDoneForCurrent ? 'btn-primary' : 'btn-primary opacity-60'}`}
            onClick={goToNextExercise}
          >
            {currentExIndex < dayExercises.length - 1 ? '下一个动作' : '结束训练'}
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="mt-8 animate-fade-in-delay-3">
        <h3 className="text-sm font-medium text-gray-600 mb-3">📋 今日动作列表</h3>
        <div className="space-y-2">
          {dayExercises.map((ex, idx) => {
            const doneCount = (completedSets[ex.exerciseId] ?? []).filter(Boolean).length;
            const isActive = idx === currentExIndex;
            return (
              <button
                key={ex.exerciseId}
                onClick={() => setCurrentExIndex(idx)}
                className={`w-full card text-left p-4 flex items-center gap-4 transition-all ${isActive ? 'ring-2 ring-orange-400' : ''}`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                  doneCount === ex.sets
                    ? 'bg-green-500 text-white'
                    : isActive
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {doneCount === ex.sets ? <Check size={16} /> : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 truncate">{ex.name}</div>
                  <div className="text-xs text-gray-500">{ex.sets}组 × {ex.reps}</div>
                </div>
                <div className="text-sm font-semibold text-orange-500 shrink-0">
                  {doneCount}/{ex.sets}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {countdown.active && (
        <CountdownRing
          seconds={countdown.current}
          totalSeconds={countdown.total}
          onSkip={() => setCountdown(prev => ({ ...prev, active: false, current: 0 }))}
          onPause={() => setCountdown(prev => ({ ...prev, paused: !prev.paused }))}
          isPaused={countdown.paused}
        />
      )}

      {showSummary && summaryData && (
        <TrainingSummary
          duration={summaryData.duration}
          completedExercises={summaryData.completed}
          totalExercises={summaryData.total}
          calories={summaryData.calories}
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  );
}
