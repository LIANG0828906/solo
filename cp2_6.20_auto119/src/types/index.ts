export interface Habit {
  id?: number;
  name: string;
  createdAt?: string;
}

export interface HabitRecord {
  id?: number;
  habitName: string;
  date: string;
  completed: boolean;
  createdAt?: string;
}

export interface DailyStats {
  date: string;
  completed: number;
  total: number;
  percentage: number;
}

export interface HabitStats {
  habitName: string;
  completedDays: number;
  totalDays: number;
  percentage: number;
  currentStreak: number;
  longestStreak: number;
}

export interface HeatmapDataItem {
  date: string;
  count: number;
  total: number;
  level: number;
}

export interface StatsResponse {
  habits: HabitStats[];
  daily: DailyStats[];
  overall: {
    totalHabits: number;
    totalRecords: number;
    avgCompletion: number;
    bestStreak: number;
  };
}
