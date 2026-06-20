import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

export type ScheduleType = 'early' | 'night';
export type CleanlinessType = 'tidy' | 'flexible';
export type SocialType = 'outgoing' | 'solo';

export interface MatchUser {
  id: string;
  nickname: string;
  avatar: string;
  tags: string[];
  budget: [number, number];
  matchScore: number;
}

export interface MatchRequest {
  schedule: ScheduleType;
  cleanliness: CleanlinessType;
  social: SocialType;
  budgetMin: number;
  budgetMax: number;
}

export interface Member {
  id: string;
  nickname: string;
  avatar: string;
}

export interface HouseInfo {
  id: string;
  address: string;
  totalRent: number;
  members: Member[];
}

export interface RatioItem {
  userId: string;
  ratio: number;
}

export interface SplitResult {
  userId: string;
  amount: number;
}

export interface DutyItem {
  id: string;
  houseId: string;
  date: string;
  userId: string;
  area: string;
  user?: Member;
}

export interface GroceryItem {
  id: string;
  houseId: string;
  name: string;
  price: number;
  done: boolean;
  createdAt: string;
}

export interface RatingDimensions {
  punctuality: number;
  cleanliness: number;
  friendliness: number;
  quietness: number;
  sharing: number;
}

export interface Rating {
  id: string;
  fromUserId: string;
  toUserId: string;
  dimensions: RatingDimensions;
  comment: string;
  createdAt: string;
  fromUser?: Member;
  toUser?: Member;
}

export const matchApi = {
  find: (data: MatchRequest) => api.post<MatchUser[]>('/match/find', data).then((r) => r.data),
};

export const transactionsApi = {
  getHouse: () => api.get<HouseInfo>('/transactions/house').then((r) => r.data),
  splitRent: (totalRent: number, ratios: RatioItem[]) =>
    api.post<SplitResult[]>('/transactions/rent/split', { totalRent, ratios }).then((r) => r.data),
  getDuties: () => api.get<DutyItem[]>('/transactions/duty').then((r) => r.data),
  updateDuty: (id: string, userId: string) =>
    api.put<DutyItem>(`/transactions/duty/${id}`, { userId }).then((r) => r.data),
  getGroceries: () => api.get<GroceryItem[]>('/transactions/grocery').then((r) => r.data),
  addGrocery: (name: string, price: number) =>
    api.post<GroceryItem>('/transactions/grocery', { name, price }).then((r) => r.data),
  updateGrocery: (id: string, data: Partial<GroceryItem>) =>
    api.put<GroceryItem>(`/transactions/grocery/${id}`, data).then((r) => r.data),
  deleteGrocery: (id: string) => api.delete(`/transactions/grocery/${id}`).then((r) => r.data),
};

export const ratingsApi = {
  getAll: (userId?: string) =>
    api.get<Rating[]>('/ratings', { params: userId ? { userId } : undefined }).then((r) => r.data),
  create: (data: Omit<Rating, 'id' | 'createdAt'>) => api.post<Rating>('/ratings', data).then((r) => r.data),
};
