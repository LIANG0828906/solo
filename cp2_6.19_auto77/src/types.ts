export interface DayRecord {
  date: string;
  completed: boolean;
  completedAt: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  weeklyTarget: number;
  createdAt: string;
  records: DayRecord[];
}

export type StreakLevel = 0 | 1 | 2 | 3;

export interface HeatmapCell {
  date: string;
  completed: boolean;
  streakLevel: StreakLevel;
  completedAt?: string;
}

export interface HabitStore {
  habits: Habit[];
  addHabit: (data: Omit<Habit, 'id' | 'createdAt' | 'records'>) => void;
  removeHabit: (id: string) => void;
  toggleHabit: (habitId: string, date: string) => void;
  getHabitById: (id: string) => Habit | undefined;
  getTodayRecord: (habitId: string, date: string) => DayRecord | undefined;
  getStreak: (habitId: string) => number;
  getTotalCompletions: (habitId: string) => number;
  getWeeklyCount: (habitId: string) => number;
  getHeatmapData: (habitId: string) => HeatmapCell[];
  isTodayAllCompleted: () => boolean;
}
