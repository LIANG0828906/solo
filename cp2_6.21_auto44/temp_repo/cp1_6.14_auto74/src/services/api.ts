import axios from 'axios';
import { Task, ProfileData, SubmitResult, UserInfo } from '../types';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  register: (username: string, password: string) =>
    api.post<{ token: string; user: UserInfo }>('/auth/register', { username, password }),
  login: (username: string, password: string) =>
    api.post<{ token: string; user: UserInfo }>('/auth/login', { username, password }),
};

export const taskApi = {
  getAll: () => api.get<Task[]>('/tasks'),
  accept: (taskId: string) => api.post<{ userTask: any; user: UserInfo }>(`/tasks/${taskId}/accept`),
  submit: (taskId: string, lat: number, lng: number) =>
    api.post<SubmitResult>(`/tasks/${taskId}/submit`, { lat, lng }),
};

export const profileApi = {
  get: () => api.get<ProfileData>('/profile'),
  getAchievements: () => api.get('/achievements'),
};

export default api;
