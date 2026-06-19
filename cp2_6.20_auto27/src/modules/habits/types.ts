export interface Habit {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'custom';
  targetCount: number;
  reminderTimes: string[];
  createdAt: string;
  completionRate: number;
  streak: number;
}

export interface HabitRecord {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
  completedAt?: string;
}

export interface CreateHabitPayload {
  name: string;
  frequency: 'daily' | 'weekly' | 'custom';
  targetCount: number;
  reminderTimes: string[];
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  participantCount: number;
  progress: number;
  participants: ChallengeParticipant[];
  joined: boolean;
  habitRequirements?: { habitName: string; targetCount: number }[];
}

export interface ChallengeParticipant {
  id: string;
  name: string;
  progress: number;
  rank: number;
}

export interface StatsData {
  completionRateByDay: { date: string; rate: number }[];
  heatmapData: { hour: number; weekday: number; count: number }[];
  streakRanking: { habitName: string; streak: number; habitId: string }[];
}

export type DayStatus = 'all' | 'partial' | 'none';

export interface DayRecord {
  date: string;
  status: DayStatus;
  completedCount: number;
  totalCount: number;
}
