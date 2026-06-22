import axios from 'axios';
import { FocusRecord, Statistics, DailyStats } from '../types';

const API_BASE = '/api';

export const timerService = {
  async submitRecord(data: {
    taskId: string | null;
    duration: number;
    startTime: string;
    endTime: string;
    status: 'completed' | 'interrupted';
  }): Promise<FocusRecord> {
    const response = await axios.post<FocusRecord>(`${API_BASE}/timer/record`, data);
    return response.data;
  },

  async getRecords(): Promise<FocusRecord[]> {
    const response = await axios.get<FocusRecord[]>(`${API_BASE}/timer/records`);
    return response.data;
  },

  async getStatistics(period: 'day' | 'week' | 'month' = 'week', date?: string): Promise<Statistics> {
    const params: Record<string, string> = { period };
    if (date) params.date = date;
    const response = await axios.get<Statistics>(`${API_BASE}/statistics`, { params });
    return response.data;
  },

  async getDailyStats(period: 'day' | 'week' | 'month' = 'week', date?: string): Promise<DailyStats[]> {
    const params: Record<string, string> = { period };
    if (date) params.date = date;
    const response = await axios.get<DailyStats[]>(`${API_BASE}/statistics/daily`, { params });
    return response.data;
  },
};
