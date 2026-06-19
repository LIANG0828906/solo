import axios from 'axios';
import type {
  EssaySubmission,
  StatsResponse,
  SubmitEssayRequest,
  GrammarError,
} from '@/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const essayApi = {
  async submitEssay(data: SubmitEssayRequest): Promise<EssaySubmission> {
    const response = await api.post<EssaySubmission>('/essay/submit', data);
    return response.data;
  },

  async precheck(content: string): Promise<GrammarError[]> {
    const response = await api.get<GrammarError[]>('/essay/precheck', {
      params: { content },
    });
    return response.data;
  },

  async getEssayList(): Promise<EssaySubmission[]> {
    const response = await api.get<EssaySubmission[]>('/essay/list');
    return response.data;
  },

  async getStats(): Promise<StatsResponse> {
    const response = await api.get<StatsResponse>('/essay/stats');
    return response.data;
  },

  async getHistory(limit = 10): Promise<EssaySubmission[]> {
    const response = await api.get<EssaySubmission[]>('/essay/history', {
      params: { limit },
    });
    return response.data;
  },
};

export default essayApi;
