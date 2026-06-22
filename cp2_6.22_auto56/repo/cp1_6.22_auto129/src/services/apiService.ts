import axios from 'axios';
import { Activity, User, Comment, ActivityFormData, RegisterFormData } from '../types';
import { useStore } from '../store/useStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  useStore.getState().setLoading(true);
  return config;
});

api.interceptors.response.use(
  (response) => {
    useStore.getState().setLoading(false);
    return response;
  },
  (error) => {
    useStore.getState().setLoading(false);
    return Promise.reject(error);
  }
);

export const getActivities = async (status?: string): Promise<Activity[]> => {
  const params = status ? { status } : {};
  const response = await api.get<Activity[]>('/activities', { params });
  return response.data;
};

export const getActivityById = async (id: string): Promise<Activity> => {
  const response = await api.get<Activity>(`/activity/${id}`);
  return response.data;
};

export const createActivity = async (data: ActivityFormData): Promise<Activity> => {
  const response = await api.post<Activity>('/activities', data);
  return response.data;
};

export const registerActivity = async (activityId: string, userId: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.post('/register', { activityId, userId });
  return response.data;
};

export const checkIn = async (activityId: string, userId: string): Promise<{ success: boolean; points: number }> => {
  const response = await api.post('/checkin', { activityId, userId });
  return response.data;
};

export const getLeaderboard = async (limit?: number): Promise<User[]> => {
  const params = limit ? { limit } : {};
  const response = await api.get<User[]>('/leaderboard', { params });
  return response.data;
};

export const registerUser = async (data: RegisterFormData): Promise<User> => {
  const response = await api.post<User>('/users', data);
  return response.data;
};

export const getUserById = async (id: string): Promise<User> => {
  const response = await api.get<User>(`/users/${id}`);
  return response.data;
};

export const getComments = async (activityId: string, page: number = 1, pageSize: number = 10): Promise<{ comments: Comment[]; total: number }> => {
  const response = await api.get('/comments', {
    params: { activityId, page, pageSize }
  });
  return response.data;
};

export const createComment = async (activityId: string, userId: string, content: string): Promise<Comment> => {
  const response = await api.post<Comment>('/comments', { activityId, userId, content });
  return response.data;
};

export const likeComment = async (commentId: string, userId: string): Promise<{ likes: number }> => {
  const response = await api.put(`/comments/${commentId}/like`, { userId });
  return response.data;
};

export const getRegisteredUsers = async (userIds: string[]): Promise<User[]> => {
  const response = await api.post<User[]>('/users/batch', { userIds });
  return response.data;
};
