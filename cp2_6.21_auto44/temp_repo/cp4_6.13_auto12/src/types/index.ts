export interface User {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  reminder_time: string | null;
  created_at: string;
}

export interface Subject {
  id: number;
  user_id: number;
  name: string;
  weekly_goal_hours: number;
  color: string;
  created_at: string;
}

export interface StudySession {
  id: number;
  user_id: number;
  subject_id: number;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  notes: string;
  rating: number;
  created_at: string;
}

export interface Achievement {
  id: number;
  user_id: number;
  type: 'streak' | 'hours';
  level: 'bronze' | 'silver' | 'gold' | 'extra1' | 'extra2' | 'extra3';
  name: string;
  description: string;
  unlocked_at: string;
}

export interface TrendPoint {
  date: string;
  hours: number;
}

export interface SubjectBreakdown {
  id: number;
  name: string;
  color: string;
  hours: number;
}

export interface WeeklyReport {
  totalHours: number;
  prevTotalHours: number;
  changePercent: number;
  subjectBreakdown: SubjectBreakdown[];
  weekStart: string;
  weekEnd: string;
  encouragement: string;
}

export interface StatisticsData {
  trend: TrendPoint[];
  weekly: WeeklyReport;
  streak: number;
  totalHours: number;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  isAuthenticated: () => boolean;
}

export interface SessionCreatePayload {
  subject_id: number;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  notes: string;
  rating: number;
}
