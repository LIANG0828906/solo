import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eco_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('eco_token');
      localStorage.removeItem('eco_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  username: string;
  avatar: string;
  nickname: string;
  points: number;
  createdAt: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  date: string;
  location: string;
  maxParticipants: number;
  creatorId: string;
  createdAt: string;
  registeredCount: number;
  isRegistered: boolean;
  isCheckedIn: boolean;
  creator: { id: string; nickname: string; avatar: string };
}

export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ user: User; token: string }>('/auth/login', { username, password }),
  register: (username: string, password: string, nickname: string) =>
    api.post<{ user: User; token: string }>('/auth/register', { username, password, nickname }),
};

export const activityApi = {
  list: (search?: string, sort: string = 'date') =>
    api.get<Activity[]>('/activities', { params: { search, sort } }),
  detail: (id: string) => api.get<Activity>(`/activities/${id}`),
  create: (data: {
    title: string;
    description: string;
    coverImage: string;
    date: string;
    location: string;
    maxParticipants: number;
  }) => api.post<Activity>('/activities', data),
  register: (id: string) =>
    api.post<{ registration: any; message: string }>(`/activities/${id}/register`),
  unregister: (id: string) =>
    api.delete<{ message: string }>(`/activities/${id}/register`),
  checkin: (id: string) =>
    api.post<{ message: string; points: number }>(`/activities/${id}/checkin`),
};

export const userApi = {
  me: () => api.get<User>('/users/me'),
  myActivities: () =>
    api.get<{ created: Activity[]; participated: (Activity & { regStatus: string; registeredAt: string; checkedInAt: string | null })[] }>(
      '/users/me/activities'
    ),
};

export default api;
