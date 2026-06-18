export interface Member {
  id: number;
  nickname: string;
  avatar_url: string;
}

export interface RankingMember extends Member {
  total_steps: number;
  total_calories: number;
  rank_change?: 'up' | 'down' | 'same';
  prev_rank?: number;
}

export interface DailyRecord {
  date: string;
  steps: number;
  duration: number;
  calories: number;
}

export interface MemberDetail extends Member {
  records: DailyRecord[];
  total_steps: number;
  total_calories: number;
  avg_duration: number;
}

export interface TeamProgress {
  daily_totals: { date: string; total_steps: number; avg_calories: number }[];
  total_steps: number;
  total_calories: number;
  goal_days: number;
  current_day_steps: number;
}
