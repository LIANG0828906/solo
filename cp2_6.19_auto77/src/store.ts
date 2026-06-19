import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Habit, DayRecord, HeatmapCell, StreakLevel, HabitStore } from './types';

const STORAGE_KEY = 'habit-tracker-store-v1';

export const formatDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const todayStr = (): string => formatDate(new Date());

const parseDate = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const addDays = (d: Date, n: number): Date => {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + n);
  return nd;
};

const getWeekStart = (d: Date): Date => {
  const nd = new Date(d);
  const day = nd.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  nd.setDate(nd.getDate() + diff);
  nd.setHours(0, 0, 0, 0);
  return nd;
};

const computeStreak = (records: DayRecord[]): number => {
  const recordMap = new Map<string, DayRecord>();
  for (const r of records) {
    if (r.completed) recordMap.set(r.date, r);
  }
  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!recordMap.has(formatDate(cursor))) {
    cursor = addDays(cursor, -1);
  }
  while (recordMap.has(formatDate(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
};

const computeHeatmap = (records: DayRecord[]): HeatmapCell[] => {
  const recordMap = new Map<string, DayRecord>();
  for (const r of records) recordMap.set(r.date, r);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = addDays(today, -29);
  const cells: HeatmapCell[] = [];

  const completedSet = new Set<string>();
  for (const r of records) if (r.completed) completedSet.add(r.date);

  for (let i = 0; i < 30; i++) {
    const d = addDays(startDate, i);
    const ds = formatDate(d);
    const rec = recordMap.get(ds);
    const completed = rec?.completed ?? false;

    let level: StreakLevel = 0;
    if (completed) {
      let runBack = 0;
      let cursor = d;
      while (completedSet.has(formatDate(cursor))) {
        runBack++;
        cursor = addDays(cursor, -1);
      }
      let runForward = 0;
      cursor = addDays(d, 1);
      while (completedSet.has(formatDate(cursor)) && i + runForward + 1 < 30) {
        runForward++;
        cursor = addDays(cursor, 1);
      }
      const localStreak = runBack + runForward;
      if (localStreak >= 7) {
        level = 2;
      } else {
        level = 1;
      }
    }
    cells.push({
      date: ds,
      completed,
      streakLevel: level,
      completedAt: rec?.completedAt,
    });
  }

  const allCompleted = cells.every((c) => c.completed);
  if (allCompleted) {
    for (const c of cells) c.streakLevel = 3;
  } else {
    for (const c of cells) {
      if (c.streakLevel === 2) {
        let run = 1;
        let idx = cells.indexOf(c);
        while (idx > 0 && cells[idx - 1].completed) {
          run++;
          idx--;
        }
        idx = cells.indexOf(c);
        while (idx < cells.length - 1 && cells[idx + 1].completed) {
          run++;
          idx++;
        }
        if (run < 7) c.streakLevel = 1;
      }
    }
  }

  return cells;
};

interface PersistedState {
  habits: Habit[];
}

export const useHabitStore = create<HabitStore>()(
  persist(
    (set, get) => ({
      habits: [],

      addHabit: (data) => {
        const newHabit: Habit = {
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          records: [],
          ...data,
        };
        set((s) => ({ habits: [...s.habits, newHabit] }));
      },

      removeHabit: (id) => {
        set((s) => ({ habits: s.habits.filter((h) => h.id !== id) }));
      },

      getHabitById: (id) => {
        return get().habits.find((h) => h.id === id);
      },

      getTodayRecord: (habitId, date) => {
        const h = get().getHabitById(habitId);
        return h?.records.find((r) => r.date === date);
      },

      toggleHabit: (habitId, date) => {
        set((s) => {
          const habits = s.habits.map((h) => {
            if (h.id !== habitId) return h;
            const existing = h.records.find((r) => r.date === date);
            if (existing) {
              return {
                ...h,
                records: h.records.map((r) =>
                  r.date === date
                    ? { ...r, completed: !r.completed, completedAt: !r.completed ? new Date().toISOString() : r.completedAt }
                    : r
                ),
              };
            }
            const record: DayRecord = {
              date,
              completed: true,
              completedAt: new Date().toISOString(),
            };
            return { ...h, records: [...h.records, record] };
          });
          return { habits };
        });
      },

      getStreak: (habitId) => {
        const h = get().getHabitById(habitId);
        return h ? computeStreak(h.records) : 0;
      },

      getTotalCompletions: (habitId) => {
        const h = get().getHabitById(habitId);
        return h ? h.records.filter((r) => r.completed).length : 0;
      },

      getWeeklyCount: (habitId) => {
        const h = get().getHabitById(habitId);
        if (!h) return 0;
        const ws = getWeekStart(new Date());
        const we = addDays(ws, 7);
        return h.records.filter(
          (r) => r.completed && parseDate(r.date) >= ws && parseDate(r.date) < we
        ).length;
      },

      getHeatmapData: (habitId) => {
        const h = get().getHabitById(habitId);
        return h ? computeHeatmap(h.records) : [];
      },

      isTodayAllCompleted: () => {
        const today = todayStr();
        const habits = get().habits;
        if (habits.length === 0) return false;
        return habits.every((h) => h.records.find((r) => r.date === today)?.completed);
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s): PersistedState => ({ habits: s.habits }),
    }
  )
);
