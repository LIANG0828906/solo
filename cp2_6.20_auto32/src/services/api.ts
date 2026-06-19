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

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        localStorage.removeItem('auth_token');
      }

      if (status === 429) {
        console.warn('请求过于频繁，请稍后再试');
      }

      const message = data?.detail || data?.message || `请求失败 (${status})`;
      return Promise.reject(new Error(message));
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('请求超时，请检查网络连接'));
    }

    return Promise.reject(new Error('网络错误，请检查网络连接'));
  }
);

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
