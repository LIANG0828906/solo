import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import type {
  HeritageItem,
  HeritageListResponse,
  HeritageListParams,
  AuthResponse,
  User,
  ApiResponse,
} from '../types';

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('heritage_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('heritage_token');
      localStorage.removeItem('heritage_user');
    }
    return Promise.reject(error);
  },
);

export const getHeritageList = async (
  params: HeritageListParams = {},
): Promise<HeritageListResponse> => {
  const response = await api.get<ApiResponse<HeritageListResponse>>('/heritage', { params });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '获取非遗列表失败');
  }
  return response.data.data;
};

export const getHeritageDetail = async (id: string): Promise<HeritageItem> => {
  const response = await api.get<ApiResponse<HeritageItem>>(`/heritage/${id}`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '获取非遗详情失败');
  }
  return response.data.data;
};

export const createHeritage = async (formData: FormData): Promise<HeritageItem> => {
  const response = await api.post<ApiResponse<HeritageItem>>('/heritage', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '创建非遗档案失败');
  }
  return response.data.data;
};

export const rateHeritage = async (
  id: string,
  userId: string,
  score: number,
): Promise<{ success: boolean; averageRating: number; ratingsCount: number }> => {
  const response = await api.post<ApiResponse<{ averageRating: number; ratingsCount: number }>>(
    `/heritage/${id}/rate`,
    { userId, score },
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '评分失败');
  }
  return { success: true, ...response.data.data };
};

export const toggleFavorite = async (
  heritageId: string,
): Promise<{ success: boolean; isFavorited: boolean }> => {
  const response = await api.post<ApiResponse<{ isFavorited: boolean }>>(
    '/auth/favorites/toggle',
    { heritageId },
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '收藏操作失败');
  }
  return { success: true, ...response.data.data };
};

export const login = async (
  username: string,
  password: string,
): Promise<{ user: User; token: string }> => {
  const response = await api.post<AuthResponse>('/auth/login', { username, password });
  if (!response.data.success) {
    throw new Error(response.data.message || '登录失败');
  }
  return { user: response.data.user, token: response.data.token };
};

export const register = async (
  username: string,
  password: string,
): Promise<{ user: User; token: string }> => {
  const response = await api.post<AuthResponse>('/auth/register', { username, password });
  if (!response.data.success) {
    throw new Error(response.data.message || '注册失败');
  }
  return { user: response.data.user, token: response.data.token };
};

export const getMe = async (): Promise<User> => {
  const response = await api.get<ApiResponse<User>>('/auth/me');
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '获取用户信息失败');
  }
  return response.data.data;
};

export { api };
