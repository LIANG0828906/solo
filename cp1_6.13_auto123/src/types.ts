export interface Habit {
  id: string;
  name: string;
  frequency: number;
  timePeriod: 'morning' | 'afternoon' | 'evening' | 'anytime';
  reminderTime?: string;
  color: string;
  icon: string;
  createdAt: string;
  streak: number;
  badges: number[];
  checkins: Checkin[];
}

export interface Checkin {
  habitId: string;
  date: string;
  completed: boolean;
}

export interface DailyStats {
  date: string;
  completed: number;
  total: number;
}

export interface MonthlyTrend {
  month: string;
  completionRate: number;
}

export interface StatsData {
  heatmap: DailyStats[];
  monthlyTrend: MonthlyTrend[];
  totalHabits: number;
  todayCompleted: number;
  bestStreak: number;
}
