import { useCallback, useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useHabitStore, todayStr } from '../store';
import { HabitCard } from './HabitCard';

interface TodayListProps {
  onOpenDetail: (habitId: string) => void;
  onAllCompleted: () => void;
}

let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new Ctor();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function playSoftTone(): void {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.22, now + 0.018);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    master.connect(ctx.destination);

    const oscA = ctx.createOscillator();
    oscA.type = 'sine';
    oscA.frequency.setValueAtTime(660, now);
    oscA.frequency.exponentialRampToValueAtTime(990, now + 0.11);

    const oscB = ctx.createOscillator();
    oscB.type = 'triangle';
    oscB.frequency.setValueAtTime(1320, now + 0.05);
    oscB.frequency.exponentialRampToValueAtTime(1760, now + 0.18);

    const gA = ctx.createGain();
    gA.gain.setValueAtTime(0.45, now);
    gA.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    const gB = ctx.createGain();
    gB.gain.setValueAtTime(0.0001, now);
    gB.gain.exponentialRampToValueAtTime(0.28, now + 0.07);
    gB.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

    oscA.connect(gA).connect(master);
    oscB.connect(gB).connect(master);

    oscA.start(now);
    oscB.start(now + 0.05);
    oscA.stop(now + 0.42);
    oscB.stop(now + 0.44);
  } catch {
    /* noop */
  }
}

export function TodayList({ onOpenDetail, onAllCompleted }: TodayListProps) {
  const { habits, getTodayRecord, toggleHabit, isTodayAllCompleted } = useHabitStore(
    useShallow((s) => ({
      habits: s.habits,
      getTodayRecord: s.getTodayRecord,
      toggleHabit: s.toggleHabit,
      isTodayAllCompleted: s.isTodayAllCompleted,
    }))
  );
  const wasAllRef = useRef(false);
  const [poppingMap, setPoppingMap] = useState<Record<string, boolean>>({});
  const popTimersRef = useRef<Record<string, number>>({});
  const today = todayStr();

  useEffect(() => {
    wasAllRef.current = false;
  }, [habits.length]);

  useEffect(() => {
    const timers = popTimersRef.current;
    return () => {
      for (const k of Object.keys(timers)) {
        window.clearTimeout(timers[k]);
      }
    };
  }, []);

  const handleCheck = useCallback(
    (habitId: string) => {
      setPoppingMap((m) => ({ ...m, [habitId]: true }));
      playSoftTone();

      if (popTimersRef.current[habitId]) {
        window.clearTimeout(popTimersRef.current[habitId]);
      }

      popTimersRef.current[habitId] = window.setTimeout(() => {
        toggleHabit(habitId, today);
        delete popTimersRef.current[habitId];
        setPoppingMap((m) => {
          const next = { ...m };
          delete next[habitId];
          return next;
        });
        setTimeout(() => {
          const allNow = isTodayAllCompleted();
          if (allNow && !wasAllRef.current) {
            wasAllRef.current = true;
            onAllCompleted();
          } else if (!allNow) {
            wasAllRef.current = false;
          }
        }, 0);
      }, 420);
    },
    [toggleHabit, today, isTodayAllCompleted, onAllCompleted]
  );

  if (habits.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-emoji">☀️</div>
        <div className="empty-title">今日暂无习惯</div>
        <div className="empty-text">在下方管理面板添加一个习惯开始打卡吧</div>
      </div>
    );
  }

  return (
    <div className="today-list">
      {habits.map((h, i) => {
        const rec = getTodayRecord(h.id, today);
        const checked = !!rec?.completed;
        const popping = poppingMap[h.id] === true;
        let btnClassName = 'check-btn';
        if (popping) btnClassName += ' popping';
        if (checked || popping) btnClassName += ' checked';
        if (checked && !popping) btnClassName += ' disabled';

        const shouldDisable = checked && !popping;
        return (
          <div key={h.id} style={{ position: 'relative' }}>
            <HabitCard
              habit={h}
              weeklyCount={useHabitStore.getState().getWeeklyCount(h.id)}
              showCheck={false}
              checkedToday={checked}
              animationDelay={i * 40}
              onClick={onOpenDetail}
            />
            <button
              type="button"
              className={btnClassName}
              onClick={(e) => {
                e.stopPropagation();
                if (shouldDisable) return;
                handleCheck(h.id);
              }}
              aria-label={checked ? '已完成打卡' : '点击打卡'}
              disabled={shouldDisable}
              style={{
                position: 'absolute',
                top: '50%',
                right: '28px',
                transform: 'translateY(-50%)',
              }}
            >
              <svg className="check-svg" viewBox="0 0 24 24" aria-hidden>
                <polyline points="4 12 10 18 20 6" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
