import axios from 'axios';
import type {
  FoodItem,
  FoodRecord,
  DailySummary,
  AnalysisResponse,
  HistoryResponse,
} from '@/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export interface SearchFoodParams {
  q: string;
}

export interface AddRecordParams {
  foodId: number;
  grams: number;
  date?: string;
}

export async function searchFood(params: SearchFoodParams): Promise<FoodItem[]> {
  const response = await api.get<FoodItem[]>('/food/search', { params });
  return response.data;
}

export async function addRecord(params: AddRecordParams): Promise<FoodRecord> {
  const response = await api.post<FoodRecord>('/food/record', params);
  return response.data;
}

export async function getRecordsByDate(date: string): Promise<DailySummary> {
  const response = await api.get<DailySummary>('/food/record', {
    params: { date },
  });
  return response.data;
}

export async function deleteRecord(id: number): Promise<{ success: boolean }> {
  const response = await api.delete<{ success: boolean }>(`/food/record/${id}`);
  return response.data;
}

export async function getAnalysis(days: number = 7): Promise<AnalysisResponse> {
  const response = await api.get<AnalysisResponse>('/analysis', {
    params: { days },
  });
  return response.data;
}

export async function getHistory(
  startDate: string,
  endDate: string
): Promise<HistoryResponse> {
  const response = await api.get<HistoryResponse>('/history', {
    params: { startDate, endDate },
  });
  return response.data;
}

export async function generateWeeklyReport(
  weekStart: string
): Promise<{ pdfUrl: string; fileName: string }> {
  const response = await api.get<{ pdfUrl: string; fileName: string }>(
    '/report/weekly',
    { params: { weekStart } }
  );
  return response.data;
}

export default api;
