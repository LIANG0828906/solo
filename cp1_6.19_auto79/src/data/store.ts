import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  TimeBlock,
  DailyGoal,
  Category,
  WeeklyStats,
  GoalProgress,
  CATEGORY_COLORS,
} from '@/types/types';

export function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function calculateDailyStats(
  blocks: TimeBlock[],
  date: string
): Record<Category, number> {
  const stats: Record<Category, number> = {
    [Category.Work]: 0,
    [Category.Learning]: 0,
    [Category.Life]: 0,
    [Category.Sport]: 0,
    [Category.Social]: 0,
    [Category.Other]: 0,
  };

  blocks
    .filter((b) => b.date === date)
    .forEach((b) => {
      const duration = b.endTime - b.startTime;
      stats[b.category] += duration;
    });

  return stats;
}

export function calculateWeeklyStats(blocks: TimeBlock[]): WeeklyStats {
  const now = new Date();
  const dates: string[] = [];
  const labels: string[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    labels.push(`${month}/${day}`);
  }

  const categoryTotals: Record<Category, number> = {
    [Category.Work]: 0,
    [Category.Learning]: 0,
    [Category.Life]: 0,
    [Category.Sport]: 0,
    [Category.Social]: 0,
    [Category.Other]: 0,
  };

  const dailyData = dates.map((date, idx) => {
    const dayStats: { date: string; label: string; [key: string]: number | string } = {
      date,
      label: labels[idx],
    };

    Object.values(Category).forEach((cat) => {
      dayStats[cat] = 0;
    });

    blocks
      .filter((b) => b.date === date)
      .forEach((b) => {
        const duration = b.endTime - b.startTime;
        dayStats[b.category] = (dayStats[b.category] as number) + duration;
        categoryTotals[b.category] += duration;
      });

    return dayStats;
  });

  return { dates, categoryTotals, dailyData };
}

export function calculateGoalProgress(
  blocks: TimeBlock[],
  goals: DailyGoal[],
  date: string
): GoalProgress[] {
  const dailyStats = calculateDailyStats(blocks, date);
  return goals.map((goal) => {
    const completed = dailyStats[goal.category];
    const percentage = Math.min(100, (completed / goal.targetMinutes) * 100);
    return { goal, completed, percentage };
  });
}

interface TimeState {
  blocks: TimeBlock[];
  goals: DailyGoal[];
  createBlock: (block: Omit<TimeBlock, 'id'>) => void;
  updateBlock: (id: string, updates: Partial<TimeBlock>) => void;
  deleteBlock: (id: string) => void;
  getBlocksByDate: (date: string) => TimeBlock[];
  addGoal: (goal: Omit<DailyGoal, 'id'>) => void;
  updateGoal: (id: string, updates: Partial<DailyGoal>) => void;
  deleteGoal: (id: string) => void;
  getWeeklyStats: () => WeeklyStats;
  getDailyProgress: (date: string) => GoalProgress[];
}

export const useTimeStore = create<TimeState>()(
  persist(
    (set, get) => ({
      blocks: [],
      goals: [
        {
          id: 'goal-1',
          category: Category.Learning,
          targetMinutes: 120,
          color: CATEGORY_COLORS[Category.Learning],
        },
        {
          id: 'goal-2',
          category: Category.Sport,
          targetMinutes: 30,
          color: CATEGORY_COLORS[Category.Sport],
        },
      ],

      createBlock: (block) =>
        set((state) => ({
          blocks: [
            ...state.blocks,
            { ...block, id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` },
          ],
        })),

      updateBlock: (id, updates) =>
        set((state) => ({
          blocks: state.blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        })),

      deleteBlock: (id) =>
        set((state) => ({
          blocks: state.blocks.filter((b) => b.id !== id),
        })),

      getBlocksByDate: (date) => get().blocks.filter((b) => b.date === date),

      addGoal: (goal) =>
        set((state) => ({
          goals: [
            ...state.goals,
            { ...goal, id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` },
          ],
        })),

      updateGoal: (id, updates) =>
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        })),

      deleteGoal: (id) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        })),

      getWeeklyStats: () => calculateWeeklyStats(get().blocks),

      getDailyProgress: (date) => calculateGoalProgress(get().blocks, get().goals, date),
    }),
    {
      name: 'time-planner-storage',
    }
  )
);
