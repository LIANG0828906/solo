export interface User {
  id: string;
  email: string;
  nickname: string;
  avatar: string;
  avatarColor: string;
  createdAt: string;
}

export interface Challenge {
  id: string;
  name: string;
  duration: 7 | 14 | 30;
  dailyGoal: number;
  unit: string;
  startDate: string;
  inviteCode?: string;
  creatorId: string;
  participantIds: string[];
  createdAt: string;
  myLatestCount?: number;
  participantsCount?: number;
  total?: number;
  recordsCount?: number;
}

export interface DailyRecord {
  id: string;
  userId: string;
  challengeId: string;
  date: string;
  count: number;
  createdAt: string;
}

export interface LeaderboardEntry {
  user: User | null;
  total: number;
  records: number;
  currentRank?: number;
  previousRank?: number;
}

export type ChallengeStatus = 'active' | 'upcoming' | 'ended';

export interface GrowthDataPoint {
  date: string;
  total: number;
  challenges: Record<string, number>;
}
