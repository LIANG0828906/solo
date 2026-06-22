import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type { User, Recipe, Comment, AuthResponse, RecipeFormData } from '../types';

// 从localStorage获取token
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// 清除token和用户信息
const clearAuth = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// 创建axios实例
const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加Authorization header
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理401错误
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      clearAuth();
      // 可以在这里添加跳转到登录页的逻辑
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证相关API
export const auth = {
  // 用户注册
  register: (data: { username: string; email: string; password: string }) =>
    api.post<AuthResponse>('/auth/register', data),

  // 用户登录
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),

  // 用户登出
  logout: () =>
    api.post('/auth/logout'),
};

// 食谱相关API
export const recipes = {
  // 获取食谱列表
  getList: (params?: { page?: number; pageSize?: number; keyword?: string; difficulty?: string }) =>
    api.get<{ list: Recipe[]; total: number }>('/recipes', { params }),

  // 获取食谱详情
  getById: (id: number) =>
    api.get<Recipe>(`/recipes/${id}`),

  // 创建食谱
  create: (data: FormData) =>
    api.post<Recipe>('/recipes', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  // 切换收藏状态
  toggleFavorite: (id: number) =>
    api.post<{ isFavorite: boolean; favoriteCount: number }>(`/recipes/${id}/favorite`),

  // 获取推荐食谱
  getRecommendations: () =>
    api.get<Recipe[]>('/recipes/recommendations'),
};

// 评论相关API
export const comments = {
  // 获取评论列表
  getList: (recipeId: number, params?: { page?: number; pageSize?: number }) =>
    api.get<{ list: Comment[]; total: number }>(`/recipes/${recipeId}/comments`, { params }),

  // 创建评论
  create: (recipeId: number, data: { content: string }) =>
    api.post<Comment>(`/recipes/${recipeId}/comments`, data),
};

// 用户相关API
export const users = {
  // 获取用户信息
  getById: (id: number) =>
    api.get<User>(`/users/${id}`),

  // 获取用户的食谱列表
  getRecipes: (id: number, params?: { page?: number; pageSize?: number }) =>
    api.get<{ list: Recipe[]; total: number }>(`/users/${id}/recipes`, { params }),

  // 获取用户的收藏列表
  getFavorites: (params?: { page?: number; pageSize?: number }) =>
    api.get<{ list: Recipe[]; total: number }>('/users/favorites', { params }),
};

export default api;
