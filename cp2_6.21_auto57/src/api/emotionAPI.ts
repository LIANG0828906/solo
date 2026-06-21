import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export interface EmotionRecord {
  id: number;
  timestamp: string;
  category: string;
  intensity: number;
  energy: number;
  note: string;
  tags: string;
}

export interface CreateRecordPayload {
  timestamp: string;
  category: string;
  intensity: number;
  energy: number;
  note?: string;
  tags?: string[];
}

export interface DaySummary {
  date: string;
  avg_intensity: number;
  avg_energy: number;
  count: number;
}

export interface TrendItem {
  date: string;
  avg_intensity: number;
  avg_energy: number;
}

export interface TagStat {
  tag: string;
  avg_intensity: number;
  count: number;
}

export interface AnalysisData {
  avg_intensity: number;
  std_intensity: number;
  max_day: string | null;
  min_day: string | null;
  correlation: number | null;
  tag_stats: TagStat[];
}

export const emotionAPI = {
  createRecord: (data: CreateRecordPayload) =>
    api.post('/record', data),

  getRecords: (date: string) =>
    api.get<EmotionRecord[]>(`/records?date=${date}`),

  getRecordsRange: (startDate: string, endDate: string) =>
    api.get<EmotionRecord[]>(`/records?start_date=${startDate}&end_date=${endDate}`),

  getCalendar: (month: string) =>
    api.get<DaySummary[]>(`/calendar?month=${month}`),

  getTrends: (days: number) =>
    api.get<TrendItem[]>(`/trends?days=${days}`),

  getAnalysis: () =>
    api.get<AnalysisData>('/analysis'),

  getExportUrl: (startDate: string, endDate: string) =>
    `/api/export?start_date=${startDate}&end_date=${endDate}`,
};
