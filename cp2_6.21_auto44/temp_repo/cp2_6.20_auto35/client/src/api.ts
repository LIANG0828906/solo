import axios from 'axios';
import type { MoodData, CalendarDay, AnalysisData, ReportData } from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const createMood = (data: Omit<MoodData, 'id' | 'timestamp'>) => {
  return api.post<MoodData>('/moods', data);
};

export const getMoods = (params?: { startDate?: string; endDate?: string; emotion?: string }) => {
  return api.get<MoodData[]>('/moods', { params });
};

export const getCalendarData = (year: number, month: number) => {
  return api.get<CalendarDay[]>('/moods/calendar', { params: { year, month } });
};

export const getAnalysisData = (days: number = 30) => {
  return api.get<AnalysisData>('/moods/analysis', { params: { days } });
};

export const getWeeklyReport = () => {
  return api.get<ReportData>('/reports/weekly');
};

export default api;
