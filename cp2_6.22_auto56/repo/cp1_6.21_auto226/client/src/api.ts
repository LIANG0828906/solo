import axios from 'axios';
import { Inspiration, DailyStats, StatusStats, FilterParams } from './types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export const fetchInspirations = async (params: Partial<FilterParams>): Promise<Inspiration[]> => {
  const res = await api.get('/inspirations', { params });
  return res.data;
};

export const createInspiration = async (data: Partial<Inspiration>): Promise<Inspiration> => {
  const res = await api.post('/inspirations', data);
  return res.data;
};

export const updateInspiration = async (
  id: string,
  data: Partial<Inspiration>
): Promise<Inspiration> => {
  const res = await api.put(`/inspirations/${id}`, data);
  return res.data;
};

export const deleteInspiration = async (id: string): Promise<{ success: boolean }> => {
  const res = await api.delete(`/inspirations/${id}`);
  return res.data;
};

export const fetchDailyStats = async (days = 7): Promise<DailyStats[]> => {
  const res = await api.get('/stats/daily', { params: { days } });
  return res.data;
};

export const fetchStatusStats = async (): Promise<StatusStats> => {
  const res = await api.get('/stats/status');
  return res.data;
};
