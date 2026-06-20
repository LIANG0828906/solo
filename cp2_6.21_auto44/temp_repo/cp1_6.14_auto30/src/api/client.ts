import axios from 'axios';
import type {
  Exploration,
  Comment,
  ExplorationDetail,
  CreateExplorationPayload,
  CreateCommentPayload,
  User,
} from '@/types';

const api = axios.create({
  baseURL: '/',
  timeout: 15000,
});

export const explorationApi = {
  getAll: () => api.get<Exploration[]>('/api/explorations').then((r) => r.data),
  getDetail: (id: string, userId: string) =>
    api.get<ExplorationDetail>(`/api/explorations/${id}`, { params: { userId } }).then((r) => r.data),
  create: (payload: CreateExplorationPayload & { createdBy: string }) =>
    api.post<Exploration>('/api/explorations', payload).then((r) => r.data),
  update: (id: string, payload: Partial<CreateExplorationPayload>) =>
    api.put<Exploration>(`/api/explorations/${id}`, payload).then((r) => r.data),
  remove: (id: string) => api.delete(`/api/explorations/${id}`),
  visit: (id: string) => api.post(`/api/explorations/${id}/visit`),
  getMine: (userId: string) =>
    api.get<Exploration[]>('/api/mine/explorations', { params: { userId } }).then((r) => r.data),
};

export const commentApi = {
  create: (payload: CreateCommentPayload) =>
    api.post<Comment>('/api/comments', payload).then((r) => r.data),
  remove: (id: string) => api.delete(`/api/comments/${id}`),
};

export const favoriteApi = {
  list: (userId: string) =>
    api.get<Exploration[]>('/api/favorites', { params: { userId } }).then((r) => r.data),
  add: (explorationId: string, userId: string) =>
    api.post(`/api/favorites/${explorationId}`, { userId }).then((r) => r.data),
  remove: (explorationId: string, userId: string) =>
    api.delete(`/api/favorites/${explorationId}`, { params: { userId } }).then((r) => r.data),
};

export const uploadApi = {
  image: async (file: Blob | File, filename = 'image.jpg') => {
    const fd = new FormData();
    fd.append('image', file, filename);
    const res = await api.post<{ url: string }>('/api/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url;
  },
};

export const userApi = {
  get: (id: string) => api.get<User>(`/api/users/${id}`).then((r) => r.data),
};
