import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  User,
  Vinyl,
  PlayRecord,
  Post,
  CommunityFeed,
  LoginResponse,
  VinylSearchParams,
  PaginationParams,
  ApiResponse,
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

        const response = await axios.post<ApiResponse<LoginResponse>>('/api/auth/refresh', {
          refresh_token: refreshTokenValue,
        });

        const { token, refresh_token } = response.data.data;
        localStorage.setItem('token', token);
        if (refresh_token) {
          localStorage.setItem('refresh_token', refresh_token);
        }

        onTokenRefreshed(token);

        if (originalRequest.headers) {
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
      (error.response?.data as any)?.message ||
      error.message ||
      '请求失败，请稍后重试';

    if (error.response?.status !== 401) {
      showToast(message, 'error');
    }

    return Promise.reject(error);
  }
);

export const vinylApi = {
  getVinyls: (params?: VinylSearchParams) =>
    api.get<any, ApiResponse<{ vinyls: Vinyl[]; total: number }>>('/vinyls', { params }),

  searchVinyls: (params: { search?: string; genre?: string }) =>
    api.get<any, ApiResponse<Vinyl[]>>('/vinyls/search', { params }),

  getVinyl: (id: string) =>
    api.get<any, ApiResponse<Vinyl>>(`/vinyls/${id}`),

  createVinyl: (formData: FormData) =>
    api.post<any, ApiResponse<Vinyl>>('/vinyls', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateVinyl: (id: string, data: any) =>
    api.put<any, ApiResponse<Vinyl>>(`/vinyls/${id}`, data),

  updateVinylRating: (id: string, rating: number) =>
    api.patch<any, ApiResponse<Vinyl>>(`/vinyls/${id}/rating`, { rating }),

  deleteVinyl: (id: string) =>
    api.delete<any, ApiResponse<void>>(`/vinyls/${id}`),
};

export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post<any, ApiResponse<LoginResponse>>('/auth/login', data),

  register: (data: any) =>
    api.post<any, ApiResponse<LoginResponse>>('/auth/register', data),

  refreshToken: () =>
    api.post<any, ApiResponse<LoginResponse>>('/auth/refresh'),
};

export const userApi = {
  getUserProfile: (id: string) =>
    api.get<any, ApiResponse<User>>(`/users/${id}`),

  updateUserProfile: (id: string, formData: FormData) =>
    api.put<any, ApiResponse<User>>(`/users/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getPlayRecords: (userId: string) =>
    api.get<any, ApiResponse<PlayRecord[]>>(`/users/${userId}/play-records`),

  getPresetAvatars: () =>
    api.get<any, ApiResponse<string[]>>('/users/preset-avatars'),
};

export const communityApi = {
  getCommunityFeed: (params?: PaginationParams) =>
    api.get<any, ApiResponse<CommunityFeed>>('/community/feed', { params }),

  likePost: (postId: string) =>
    api.post<any, ApiResponse<{ likes_count: number; is_liked: boolean }>>(
      `/community/posts/${postId}/like`
    ),

  commentPost: (postId: string, content: string) =>
    api.post<any, ApiResponse<Post>>(`/community/posts/${postId}/comment`, {
      content,
    }),
};

export default api;
