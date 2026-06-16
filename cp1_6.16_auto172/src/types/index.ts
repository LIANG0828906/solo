export interface User {
  id: string;
  nickname: string;
  avatar: string;
  points: number;
  completedTasks: string[];
  lastResetDate: string;
}

export interface Task {
  id: string;
  name: string;
  icon: string;
  points: number;
  description: string;
}

export interface Coffee {
  id: string;
  name: string;
  brand: string;
  flavor: string;
  requiredPoints: number;
  stock: number;
  image: string;
}

export interface ExchangeRecord {
  id: string;
  userId: string;
  coffeeId: string;
  coffeeName: string;
  pointsSpent: number;
  exchangedAt: string;
}

export interface RankItem {
  userId: string;
  nickname: string;
  avatar: string;
  points: number;
  rank: number;
}

export interface RankData {
  rankList: RankItem[];
  currentUserRank: number;
  currentUserPoints: number;
}

export interface ExchangeRecordsResponse {
  list: ExchangeRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export type TimeRange = 'week' | 'month' | 'all';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface CompleteTaskResponse {
  success: boolean;
  message: string;
  points: number;
  taskName?: string;
}

export interface ExchangeResponse {
  success: boolean;
  message: string;
  remainingStock?: number;
  record?: ExchangeRecord;
}
