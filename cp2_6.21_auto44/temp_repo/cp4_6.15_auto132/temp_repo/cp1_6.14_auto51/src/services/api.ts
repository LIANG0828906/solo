import axios from 'axios';
import type { Post, EngagementData, DailyTrend, DashboardStats, User } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (username: string, password: string) => {
    const { data } = await api.post<{ user: User; token: string }>('/auth/login', {
      username,
      password,
    });
    return data;
  },
};

export const postsApi = {
  getPosts: async (params?: { status?: string; platform?: string }) => {
    const { data } = await api.get<Post[]>('/posts', { params });
    return data;
  },

  getPost: async (id: string) => {
    const { data } = await api.get<Post>(`/posts/${id}`);
    return data;
  },

  createPost: async (post: Partial<Post>) => {
    const { data } = await api.post<Post>('/posts', post);
    return data;
  },

  updatePost: async (id: string, post: Partial<Post>) => {
    const { data } = await api.put<Post>(`/posts/${id}`, post);
    return data;
  },

  deletePost: async (id: string) => {
    const { data } = await api.delete<{ success: boolean }>(`/posts/${id}`);
    return data;
  },
};

export const dashboardApi = {
  getStats: async () => {
    const { data } = await api.get<DashboardStats>('/dashboard/stats');
    return data;
  },
};

export const engagementApi = {
  getEngagement: async () => {
    const { data } = await api.get<EngagementData[]>('/engagement');
    return data;
  },

  getTrend: async (platform?: string) => {
    const { data } = await api.get<DailyTrend[]>('/engagement/trend', {
      params: platform ? { platform } : {},
    });
    return data;
  },
};

export const aiApi = {
  generateSummary: async (content: string) => {
    const { data } = await api.post<{ summary: string }>('/ai/summary', { content });
    return data;
  },
};

export default api;
