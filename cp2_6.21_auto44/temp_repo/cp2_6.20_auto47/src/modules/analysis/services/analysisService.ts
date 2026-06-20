import axios from 'axios';
import type { AnalysisReport } from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export const analysisService = {
  async getReport(sessionId: string): Promise<AnalysisReport> {
    const { data } = await api.get<AnalysisReport>(`/analysis/${sessionId}`);
    return data;
  },

  async getHistory(): Promise<AnalysisReport[]> {
    const { data } = await api.get<AnalysisReport[]>('/analysis/history');
    return data;
  },
};
