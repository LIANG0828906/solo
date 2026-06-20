export type TransportMode = 'walk' | 'bike' | 'bus' | 'subway' | 'car' | 'plane';

export interface TransportOption {
  mode: TransportMode;
  label: string;
  icon: string;
  emissionFactor: number;
  isGreen: boolean;
}

export interface TripRecord {
  id: string;
  mode: TransportMode;
  distance: number;
  date: string;
  carbonEmission: number;
  carbonSaved: number;
  createdAt: number;
}

export interface DailyStats {
  date: string;
  totalEmission: number;
  totalSaved: number;
  tripCount: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  threshold: number;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  weeklySaved: number;
  monthlySaved: number;
  isCurrentUser: boolean;
}

export interface AppState {
  trips: TripRecord[];
  achievements: Achievement[];
  currentUserName: string;
  lastLeaderboardUpdate: number;
}

export const TRANSPORT_OPTIONS: TransportOption[] = [
  { mode: 'walk', label: '步行', icon: '🚶', emissionFactor: 0, isGreen: true },
  { mode: 'bike', label: '骑行', icon: '🚴', emissionFactor: 0, isGreen: true },
  { mode: 'bus', label: '公交', icon: '🚌', emissionFactor: 50, isGreen: true },
  { mode: 'subway', label: '地铁', icon: '🚇', emissionFactor: 30, isGreen: true },
  { mode: 'car', label: '私家车', icon: '🚗', emissionFactor: 180, isGreen: false },
  { mode: 'plane', label: '飞机', icon: '✈️', emissionFactor: 255, isGreen: false },
];

export const ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
  { id: 'starter', name: '环保新手', description: '累计减碳 1kg', icon: '🌱', threshold: 1 },
  { id: 'bronze', name: '绿色先锋', description: '累计减碳 10kg', icon: '🌿', threshold: 10 },
  { id: 'silver', name: '低碳达人', description: '累计减碳 50kg', icon: '🌳', threshold: 50 },
  { id: 'gold', name: '环保卫士', description: '累计减碳 100kg', icon: '🌲', threshold: 100 },
  { id: 'platinum', name: '地球英雄', description: '累计减碳 500kg', icon: '🌍', threshold: 500 },
];

export const MOCK_USERS: Omit<LeaderboardUser, 'isCurrentUser'>[] = [
  { id: 'u1', name: '绿色小王', avatar: '👨‍🌾', weeklySaved: 12.5, monthlySaved: 45.2 },
  { id: 'u2', name: '骑行达人', avatar: '🚴‍♀️', weeklySaved: 8.3, monthlySaved: 32.1 },
  { id: 'u3', name: '地铁常客', avatar: '👩‍💼', weeklySaved: 15.7, monthlySaved: 58.9 },
  { id: 'u4', name: '步行健将', avatar: '🏃', weeklySaved: 6.2, monthlySaved: 24.8 },
  { id: 'u5', name: '公交先锋', avatar: '👨‍🔧', weeklySaved: 9.8, monthlySaved: 38.5 },
  { id: 'u6', name: '环保小明', avatar: '🧑‍🎓', weeklySaved: 11.1, monthlySaved: 42.3 },
  { id: 'u7', name: '低碳生活家', avatar: '👩‍🍳', weeklySaved: 14.4, monthlySaved: 52.7 },
];

export const CURRENT_USER_NAME = '我';
