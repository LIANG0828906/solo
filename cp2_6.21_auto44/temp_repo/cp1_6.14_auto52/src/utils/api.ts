import axios from 'axios';
import type { Idea, Task, User, Comment, SortType } from '../types';

const api = axios.create({
  baseURL: '/api',
});

export interface IdeaListResponse {
  total: number;
  items: Idea[];
}

export const ideaApi = {
  getList: (params: { sort?: SortType; q?: string; limit?: number; offset?: number } = {}) =>
    api.get<IdeaListResponse>('/ideas', { params }).then(res => res.data),

  getDetail: (id: string) =>
    api.get<Idea>(`/ideas/${id}`).then(res => res.data),

  getTrending: () =>
    api.get<any[]>('/ideas/trending').then(res => res.data),

  vote: (id: string) =>
    api.post(`/ideas/${id}/vote`).then(res => res.data),

  like: (id: string) =>
    api.post(`/ideas/${id}/like`).then(res => res.data),

  addComment: (id: string, content: string) =>
    api.post<Comment>(`/ideas/${id}/comments`, { content }).then(res => res.data),

  replyComment: (ideaId: string, commentId: string, content: string) =>
    api.post<Comment>(`/ideas/${ideaId}/comments/${commentId}/reply`, { content }).then(res => res.data),

  likeComment: (ideaId: string, commentId: string) =>
    api.post(`/ideas/${ideaId}/comments/${commentId}/like`).then(res => res.data),
};

export const taskApi = {
  getList: () =>
    api.get<Task[]>('/tasks').then(res => res.data),

  create: (data: { ideaId: string; title: string; dueDate: string; assigneeId: string; priority: 'high' | 'medium' | 'low' }) =>
    api.post<{ task: Task; idea: { id: string; status: string; taskId: string } }>('/tasks', data).then(res => res.data),
};

export const userApi = {
  getList: () =>
    api.get<User[]>('/users').then(res => res.data),

  getCurrent: () =>
    api.get<User>('/users/current').then(res => res.data),
};

export default api;
