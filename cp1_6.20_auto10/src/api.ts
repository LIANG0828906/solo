import axios from 'axios';
import type { Work, Stats, CreateWorkData, UpdateWorkData, AddCommentData, Comment } from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const getWorks = (category?: string): Promise<Work[]> => {
  const params = category ? { category } : {};
  return api.get('/works', { params });
};

export const getWork = (id: string): Promise<Work> => {
  return api.get(`/works/${id}`);
};

export const createWork = (data: CreateWorkData): Promise<Work> => {
  return api.post('/works', data);
};

export const updateWork = (id: string, data: UpdateWorkData): Promise<Work> => {
  return api.put(`/works/${id}`, data);
};

export const deleteWork = (id: string): Promise<void> => {
  return api.delete(`/works/${id}`);
};

export const likeWork = (id: string): Promise<{ likes: number }> => {
  return api.post(`/works/${id}/like`);
};

export const addComment = (id: string, data: AddCommentData): Promise<Comment> => {
  return api.post(`/works/${id}/comments`, data);
};

export const getStats = (): Promise<Stats> => {
  return api.get('/stats');
};

export default api;
