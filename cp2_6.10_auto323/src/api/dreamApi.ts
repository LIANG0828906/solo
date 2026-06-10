import axios from 'axios';
import type { DreamSymbol, DreamSlot, DreamResult, WeeklyReport } from '../types/dream';

const api = axios.create({
  baseURL: '/api/dream',
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.message);
    if (error.response) {
      console.error('Error data:', error.response.data);
      console.error('Error status:', error.response.status);
    }
    return Promise.reject(error);
  }
);

export const getDailySymbols = async (date: string): Promise<DreamSymbol[]> => {
  try {
    const response = await api.get<DreamSymbol[]>('/symbols', {
      params: { date },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch daily symbols:', error);
    throw error;
  }
};

export const generateDream = async (date: string, symbols: DreamSlot[]): Promise<DreamResult> => {
  try {
    const response = await api.post<DreamResult>('/generate', {
      date,
      symbols,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to generate dream:', error);
    throw error;
  }
};

export const saveDreamRecord = async (record: DreamResult): Promise<{ success: boolean }> => {
  try {
    const response = await api.post<{ success: boolean }>('/save', record);
    return response.data;
  } catch (error) {
    console.error('Failed to save dream record:', error);
    throw error;
  }
};

export const getWeeklyReport = async (weekStart: string): Promise<WeeklyReport> => {
  try {
    const response = await api.get<WeeklyReport>('/weekly-report', {
      params: { weekStart },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch weekly report:', error);
    throw error;
  }
};

export default api;
