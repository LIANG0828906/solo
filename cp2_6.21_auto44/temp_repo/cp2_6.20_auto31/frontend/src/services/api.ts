import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  User,
  Vinyl,
  Post,
  Comment,
  VinylSearchParams,
  PaginationParams,
} from '../types';

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const showToast = (message: string, type: 'error' | 'success' | 'warning' = 'error') => {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('toast', { detail: { message, type } });
    window.dispatchEvent(event);
  }
};

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshTokenValue = localStorage.getItem('refresh_token');
        if (!refreshTokenValue) {
          throw new Error('No refresh token');
        }

        const response = await axios.post('/api/users/auth/refresh', null, {
          headers: { Authorization: `Bearer ${refreshTokenValue}` },
          baseURL: '',
        });

        const token = response.data.access_token || response.data.token;
        if (token) {
          localStorage.setItem('token', token);
          onTokenRefreshed(token);
        }

        if (originalRequest.headers && token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const message =
      (error.response?.data as any)?.detail ||
      (error.response?.data as any)?.message ||
      error.message ||
      '请求失败，请稍后重试';

    if (error.response?.status !== 401) {
      showToast(message, 'error');
    }

    return Promise.reject(error);
  }
);

export interface PagedVinyls {
  vinyls: Vinyl[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface UserProfileResponse {
  user: User;
  stats: {
    collection_count: number;
    total_plays: number;
    avg_rating: number | null;
    genre_distribution: Record<string, number>;
  };
}

export interface HeatmapDataItem {
  date: string;
  count: number;
  tracks: Vinyl[];
}

export interface WeeklyPlayTimeItem {
  week: string;
  hours: number;
}

export interface CommunityFeedResponse {
  items: Post[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface LikeResponse {
  likes_count: number;
  is_liked: boolean;
}

export interface LoginPayload {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export const getVinyls = (params?: VinylSearchParams): Promise<PagedVinyls> =>
  api.get<any, any>('/vinyls', { params }).then((res: any) => ({
    vinyls: res.items || [],
    total: res.total || 0,
    page: res.page || 1,
    limit: res.limit || 20,
    pages: res.pages || 0,
  }));

export const searchVinyls = (params: { search?: string; genre?: string; page?: number; limit?: number }): Promise<PagedVinyls> =>
  api.get<any, any>('/vinyls/search', { params }).then((res: any) => ({
    vinyls: res.items || [],
    total: res.total || 0,
    page: res.page || 1,
    limit: res.limit || 20,
    pages: Math.ceil((res.total || 0) / (res.limit || 20)),
  }));

export const getVinyl = (id: string): Promise<any> =>
  api.get<any, any>(`/vinyls/${id}`);

export const createVinyl = (formData: FormData): Promise<{ vinyl: Vinyl; post: Post }> =>
  api.post<any, any>('/vinyls', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateVinyl = (id: string, formData: FormData): Promise<Vinyl> =>
  api.put<any, Vinyl>(`/vinyls/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateVinylRating = (id: string, rating: number): Promise<Vinyl> =>
  api.patch<any, Vinyl>(`/vinyls/${id}/rating`, null, { params: { rating } });

export const deleteVinyl = (id: string): Promise<void> =>
  api.delete<any, void>(`/vinyls/${id}`);

export const login = (data: { email: string; password: string }): Promise<LoginPayload> =>
  api.post<any, any>('/users/auth/login', data);

export const register = (data: { username: string; email: string; password: string; bio?: string; avatar_url?: string }): Promise<LoginPayload> =>
  api.post<any, any>('/users/auth/register', data);

export const refreshToken = (): Promise<any> =>
  api.post<any, any>('/users/auth/refresh');

export const getUserProfile = (id: string): Promise<UserProfileResponse> =>
  api.get<any, any>(`/users/${id}`);

export const updateUserProfile = (id: string, formData: FormData): Promise<User> =>
  api.put<any, User>(`/users/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getPlayRecords = (userId: string, params?: { year?: number }): Promise<{ items: HeatmapDataItem[] }> =>
  api.get<any, any>(`/users/${userId}/play-records`, { params });

export const getWeeklyPlayTime = (userId: string): Promise<WeeklyPlayTimeItem[]> =>
  api.get<any, any>(`/users/${userId}/weekly-play-time`);

export const getPresetAvatars = (): Promise<string[]> =>
  api.get<any, any>('/users/preset-avatars');

export const getCommunityFeed = (params?: PaginationParams): Promise<CommunityFeedResponse> =>
  api.get<any, CommunityFeedResponse>('/community/feed', { params });

export const likePost = (postId: string): Promise<LikeResponse> =>
  api.post<any, LikeResponse>(`/community/posts/${postId}/like`);

export const commentPost = (postId: string, content: string): Promise<Comment> =>
  api.post<any, Comment>(`/community/posts/${postId}/comment`, null, {
    params: { content },
  });

export const getTrendingVinyls = (): Promise<any[]> =>
  api.get<any, any>('/community/posts/trending');

export default api;
