import axios from 'axios';
import type {
  User,
  Snippet,
  AuthResponse,
  ApiResponse,
  Language,
} from './types';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || '请求失败';
    throw new Error(message);
  }
);

export const register = (username: string, password: string): Promise<AuthResponse> => {
  return api.post<ApiResponse<AuthResponse>, AuthResponse>('/auth/register', {
    username,
    password,
  });
};

export const login = (username: string, password: string): Promise<AuthResponse> => {
  return api.post<ApiResponse<AuthResponse>, AuthResponse>('/auth/login', {
    username,
    password,
  });
};

export const getSnippets = (params?: {
  search?: string;
  language?: string;
}): Promise<Snippet[]> => {
  return api.get<ApiResponse<Snippet[]>, Snippet[]>('/snippets', { params });
};

export const getSnippet = (id: string): Promise<Snippet> => {
  return api.get<ApiResponse<Snippet>, Snippet>(`/snippets/${id}`);
};

export const createSnippet = (data: {
  title: string;
  language: Language;
  content: string;
  visibility: 'public' | 'private';
  tags: string[];
}): Promise<Snippet> => {
  return api.post<ApiResponse<Snippet>, Snippet>('/snippets', data);
};

export const updateSnippet = (id: string, data: any): Promise<Snippet> => {
  return api.put<ApiResponse<Snippet>, Snippet>(`/snippets/${id}`, data);
};

export const getMySnippets = (): Promise<Snippet[]> => {
  return api.get<ApiResponse<Snippet[]>, Snippet[]>('/snippets/my');
};

export const getFavorites = (): Promise<Snippet[]> => {
  return api.get<ApiResponse<Snippet[]>, Snippet[]>('/favorites');
};

export const addFavorite = (snippetId: string): Promise<void> => {
  return api.post<ApiResponse<void>, void>('/favorites', { snippetId });
};

export const removeFavorite = (snippetId: string): Promise<void> => {
  return api.delete<ApiResponse<void>, void>(`/favorites/${snippetId}`);
};
