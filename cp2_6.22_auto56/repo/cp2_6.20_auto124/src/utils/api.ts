import axios from 'axios';
import type { TrainingRecord, CreateRecordDto, Achievement, MonthStats } from '@/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.message);
    return Promise.reject(error);
  }
);

export const recordApi = {
  getAll: (): Promise<TrainingRecord[]> => api.get('/records'),
  create: (data: CreateRecordDto): Promise<TrainingRecord> => api.post('/records', data),
};

export const achievementApi = {
  getAll: (): Promise<Achievement[]> => api.get('/achievements'),
};

export const statsApi = {
  getMonthStats: (month: string): Promise<MonthStats> => api.get('/stats', { params: { month } }),
};
