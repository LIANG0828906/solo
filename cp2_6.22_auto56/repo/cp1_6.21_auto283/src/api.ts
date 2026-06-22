import axios from 'axios';
import type { Schedule, SmartSuggestion, DayStats } from './types';

const api = axios.create({
  baseURL: '/api'
});

export const getSchedules = async (year?: number, month?: number): Promise<Schedule[]> => {
  const params: Record<string, string> = {};
  if (year !== undefined) params.year = String(year);
  if (month !== undefined) params.month = String(month);
  
  const res = await api.get('/schedules', { params });
  return res.data;
};

export const createSchedule = async (data: Partial<Schedule>): Promise<Schedule> => {
  const res = await api.post('/schedules', data);
  return res.data;
};

export const updateSchedule = async (id: string, data: Partial<Schedule>): Promise<Schedule> => {
  const res = await api.put(`/schedules/${id}`, data);
  return res.data;
};

export const deleteSchedule = async (id: string): Promise<void> => {
  await api.delete(`/schedules/${id}`);
};

export const toggleComplete = async (id: string): Promise<Schedule> => {
  const res = await api.patch(`/schedules/${id}/complete`);
  return res.data;
};

export const getSmartSuggest = async (date: string, duration: number): Promise<SmartSuggestion[]> => {
  const res = await api.get('/smart-suggest', {
    params: { date, duration }
  });
  return res.data;
};

export const getMonthlyStats = async (year: number, month: number): Promise<DayStats[]> => {
  const res = await api.get('/monthly-stats', {
    params: { year, month }
  });
  return res.data;
};
