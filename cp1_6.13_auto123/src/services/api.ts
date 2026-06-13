import axios from 'axios';
import type { Habit, StatsData, Checkin } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

export const habitApi = {
  async getHabits(): Promise<Habit[]> {
    const response = await api.get('/habits');
    return response.data;
  },

  async createHabit(habit: Omit<Habit, 'id' | 'createdAt' | 'streak' | 'badges' | 'checkins'>): Promise<Habit> {
    const response = await api.post('/habits', habit);
    return response.data;
  },

  async updateHabit(id: string, habit: Partial<Habit>): Promise<Habit> {
    const response = await api.put(`/habits/${id}`, habit);
    return response.data;
  },

  async deleteHabit(id: string): Promise<void> {
    await api.delete(`/habits/${id}`);
  },

  async checkin(checkin: Omit<Checkin, 'completed'> & { completed?: boolean }): Promise<Habit> {
    const response = await api.post('/checkin', checkin);
    return response.data;
  },

  async getStats(): Promise<StatsData> {
    const response = await api.get('/stats');
    return response.data;
  },
};

export default habitApi;
