export type ActivityType = 'lottery' | 'vote';

export interface LotteryConfig {
  prizeName: string;
  winnerCount: number;
  deadline: string;
}

export interface VoteConfig {
  options: string[];
  deadline: string;
}

export type ActivityConfig = LotteryConfig | VoteConfig;

export interface Activity {
  id: string;
  code: string;
  name: string;
  type: ActivityType;
  config: ActivityConfig;
  createdAt: string;
}

export interface Participation {
  id: string;
  activityId: string;
  identifier: string;
  type: ActivityType;
  result: string;
  timestamp: string;
}

export interface ActivitySummary extends Activity {
  participationCount: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}
