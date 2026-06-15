import axios from 'axios';
import type { Member, Task, Reward, Category, WeeklyReport } from '@/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const memberApi = {
  getMembers: () => api.get<void, Member[]>('/members'),
  createMember: (data: Omit<Member, 'id' | 'points'>) =>
    api.post<Omit<Member, 'id' | 'points'>, Member>('/members', data),
  updateMember: (id: string, data: Partial<Member>) =>
    api.put<Partial<Member>, Member>(`/members/${id}`, data),
  deleteMember: (id: string) => api.delete<void, void>(`/members/${id}`),
};

export const taskApi = {
  getTasks: () => api.get<void, Task[]>('/tasks'),
  createTask: (data: Omit<Task, 'id' | 'status' | 'createdAt'>) =>
    api.post<Omit<Task, 'id' | 'status' | 'createdAt'>, Task>('/tasks', data),
  updateTask: (id: string, data: Partial<Task>) =>
    api.put<Partial<Task>, Task>(`/tasks/${id}`, data),
  deleteTask: (id: string) => api.delete<void, void>(`/tasks/${id}`),
  completeTask: (id: string) =>
    api.post<void, Task>(`/tasks/${id}/complete`),
  assignTask: (id: string, assigneeId: string | null) =>
    api.put<{ assigneeId: string | null }, Task>(`/tasks/${id}/assign`, {
      assigneeId,
    }),
};

export const rewardApi = {
  getRewards: () => api.get<void, Reward[]>('/rewards'),
  createReward: (data: Omit<Reward, 'id'>) =>
    api.post<Omit<Reward, 'id'>, Reward>('/rewards', data),
  updateReward: (id: string, data: Partial<Reward>) =>
    api.put<Partial<Reward>, Reward>(`/rewards/${id}`, data),
  deleteReward: (id: string) => api.delete<void, void>(`/rewards/${id}`),
  redeemReward: (id: string, memberId: string) =>
    api.post<{ memberId: string }, Reward>(`/rewards/${id}/redeem`, {
      memberId,
    }),
};

export const reportApi = {
  getWeeklyReport: () => api.get<void, WeeklyReport>('/report/weekly'),
  generateWeeklyReport: () =>
    api.post<void, WeeklyReport>('/report/generate'),
};

export const categoryApi = {
  getCategories: () => api.get<void, Category[]>('/categories'),
};

export default api;
