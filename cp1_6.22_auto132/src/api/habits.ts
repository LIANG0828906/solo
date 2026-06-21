import axios from 'axios';

export interface Habit {
  id: string;
  name: string;
  description: string;
  targetDays: number;
  currentStreak: number;
  pointsPerCheckIn: number;
  createdAt: string;
  color: string;
  icon: string;
}

export interface CheckIn {
  id: string;
  habitId: string;
  date: string;
  quality: number;
  pointsEarned: number;
  createdAt: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  createdAt: string;
}

export interface UserState {
  totalPoints: number;
  totalCheckIns: number;
  currentStreak: number;
  rewardsRedeemed: number;
}

export interface CheckInParams {
  date: string;
  quality: number;
}

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getHabits = (): Promise<Habit[]> => {
  return api.get<Habit[]>('/habits').then((res) => res.data);
};

export const createHabit = (habit: Omit<Habit, 'id' | 'createdAt' | 'currentStreak'>): Promise<Habit> => {
  return api.post<Habit>('/habits', habit).then((res) => res.data);
};

export const updateHabit = (id: string, habit: Partial<Omit<Habit, 'id' | 'createdAt'>>): Promise<Habit> => {
  return api.put<Habit>(`/habits/${id}`, habit).then((res) => res.data);
};

export const deleteHabit = (id: string): Promise<void> => {
  return api.delete(`/habits/${id}`).then(() => undefined);
};

export const checkInHabit = (habitId: string, params: CheckInParams): Promise<CheckIn> => {
  return api.post<CheckIn>(`/habits/${habitId}/check-in`, params).then((res) => res.data);
};

export const getRewards = (): Promise<Reward[]> => {
  return api.get<Reward[]>('/rewards').then((res) => res.data);
};

export const createReward = (reward: Omit<Reward, 'id' | 'createdAt'>): Promise<Reward> => {
  return api.post<Reward>('/rewards', reward).then((res) => res.data);
};

export const redeemReward = (id: string): Promise<void> => {
  return api.post(`/rewards/${id}/redeem`).then(() => undefined);
};

export const getUserPoints = (): Promise<UserState> => {
  return api.get<UserState>('/user/state').then((res) => res.data);
};
