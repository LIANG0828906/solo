export type TrainingType = 'strength' | 'cardio' | 'yoga' | 'other';

export interface TrainingRecord {
  id: number;
  type: TrainingType;
  duration: number;
  date: string;
  notes: string;
  created_at: string;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  emoji: string;
  condition: string;
  unlocked: boolean;
  unlocked_at?: string;
}

export interface MonthlyStats {
  month: string;
  total_duration: number;
  count: number;
}

export interface TypeStats {
  type: TrainingType;
  count: number;
  total_duration: number;
}

export interface StatsData {
  monthly: MonthlyStats[];
  by_type: TypeStats[];
}
