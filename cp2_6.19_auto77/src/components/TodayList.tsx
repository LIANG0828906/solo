import { useCallback, useEffect, useRef } from 'react';
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
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new Ctor();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function playSoftTone() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.12);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(660, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.34);
    osc2.stop(now + 0.34);
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
  const today = todayStr();

  useEffect(() => {
    wasAllRef.current = false;
  }, [habits.length]);

  const handleCheck = useCallback(
    (habitId: string) => {
      toggleHabit(habitId, today);
      playSoftTone();
      setTimeout(() => {
        const allNow = isTodayAllCompleted();
        if (allNow && !wasAllRef.current) {
          wasAllRef.current = true;
          onAllCompleted();
        } else if (!allNow) {
          wasAllRef.current = false;
        }
      }, 0);
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
        return (
          <HabitCard
            key={h.id}
            habit={h}
            weeklyCount={useHabitStore.getState().getWeeklyCount(h.id)}
            showCheck
            checkedToday={checked}
            animationDelay={i * 40}
            onCheck={handleCheck}
            onClick={onOpenDetail}
          />
        );
      })}
    </div>
  );
}
