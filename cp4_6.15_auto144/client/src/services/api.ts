import axios from 'axios';
import { FoodJournal, CreateJournalDto, RadarData, CalendarDay } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const journalApi = {
  getAll: async (): Promise<FoodJournal[]> => {
    const response = await api.get('/journals');
    return response.data;
  },

  getById: async (id: string): Promise<FoodJournal> => {
    const response = await api.get(`/journals/${id}`);
    return response.data;
  },

  create: async (data: CreateJournalDto): Promise<FoodJournal> => {
    const response = await api.post('/journals', data);
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<CreateJournalDto>
  ): Promise<FoodJournal> => {
    const response = await api.put(`/journals/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/journals/${id}`);
  },
};

export const analyticsApi = {
  getRadarData: async (): Promise<RadarData> => {
    const response = await api.get('/analytics/radar');
    return response.data;
  },

  getCalendarData: async (year: number): Promise<CalendarDay[]> => {
    const response = await api.get(`/analytics/calendar?year=${year}`);
    return response.data;
  },
};

export default api;
