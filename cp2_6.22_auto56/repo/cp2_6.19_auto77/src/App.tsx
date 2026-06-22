import { useCallback, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useHabitStore, todayStr } from './store';
import { HabitList } from './components/HabitList';
import { TodayList } from './components/TodayList';
import { HabitDetail } from './components/HabitDetail';
import { AddHabitModal } from './components/AddHabitModal';
import type { AddHabitData } from './components/AddHabitModal';
import { Celebration } from './components/Celebration';

type View =
  | { kind: 'home' }
  | { kind: 'detail'; habitId: string };

function formatDateHeader(d: Date): string {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const w = weekdays[d.getDay()];
  return `${m}月${day}日 · ${w}`;
}

export default function App() {
  const [view, setView] = useState<View>({ kind: 'home' });
  const [addOpen, setAddOpen] = useState(false);
  const [newestId, setNewestId] = useState<string | null>(null);
  const [celebrationTrigger, setCelebrationTrigger] = useState(0);

  const { habits, getTodayRecord } = useHabitStore(
    useShallow((s) => ({
      habits: s.habits,
      getTodayRecord: s.getTodayRecord,
    }))
  );

  const addHabit = useHabitStore((s) => s.addHabit);
  const today = todayStr();

  const { completedToday, totalToday } = useMemo(() => {
    const total = habits.length;
    let done = 0;
    for (const h of habits) {
      if (getTodayRecord(h.id, today)?.completed) done++;
    }
    return { completedToday: done, totalToday: total };
  }, [habits, getTodayRecord, today]);

  const progressPercent = useMemo(() => {
    if (totalToday === 0) return 0;
    return Math.round((completedToday / totalToday) * 100);
  }, [completedToday, totalToday]);

  const handleOpenDetail = useCallback((habitId: string) => {
    setView({ kind: 'detail', habitId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBack = useCallback(() => {
    setView({ kind: 'home' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleAllCompleted = useCallback(() => {
    setCelebrationTrigger((n) => n + 1);
  }, []);

  const handleAddSubmit = useCallback(
    (data: AddHabitData) => {
      const beforeLen = habits.length;
      addHabit(data);
      setAddOpen(false);
      setTimeout(() => {
        const state = useHabitStore.getState();
        const after = state.habits;
        if (after.length > beforeLen) {
          const newest = after[after.length - 1];
          setNewestId(newest.id);
          setTimeout(() => setNewestId(null), 900);
        }
      }, 0);
    },
    [addHabit, habits.length]
  );

  return (
    <div className="app">
      <Celebration trigger={celebrationTrigger} />
      <AddHabitModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAddSubmit}
      />

      {view.kind === 'home' ? (
        <>
          <header className="app-header">
            <div>
              <div className="app-title">🔥 习惯追踪</div>
              <div className="app-subtitle">{formatDateHeader(new Date())}</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setAddOpen(true)}
                aria-label="添加习惯"
                title="添加习惯"
              >
                <svg className="plus-icon" viewBox="0 0 24 24" aria-hidden>
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          </header>

          <section className="progress-bar-wrap">
            <div className="progress-label">
              <span>
                今日进度 <strong>{completedToday}</strong> / {totalToday}
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div className="progress-track" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
              <div
                className="progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </section>

          <div className="section-title">
            <span className="dot" /> 今日习惯
          </div>
          <TodayList
            onOpenDetail={handleOpenDetail}
            onAllCompleted={handleAllCompleted}
          />

          <div className="section-title" style={{ marginTop: 30 }}>
            <span className="dot" /> 管理面板
          </div>

          <div style={{ marginBottom: 10 }}>
            <HabitList onOpenDetail={handleOpenDetail} newestId={newestId} />
          </div>

          <button
            type="button"
            className="add-btn"
            onClick={() => setAddOpen(true)}
          >
            <svg className="plus-icon" viewBox="0 0 24 24" aria-hidden>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            添加新习惯
          </button>
        </>
      ) : (
        <HabitDetail habitId={view.habitId} onBack={handleBack} />
      )}
    </div>
  );
}
