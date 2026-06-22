import axios, { AxiosError, AxiosResponse } from 'axios';
import type { User, Project, TaskStatus, TaskUpdate, WeeklyReport } from '../types';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const register = async (
  username: string,
  password: string
): Promise<{ user: User; token: string }> => {
  try {
    const response = await apiClient.post('/auth/register', { username, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const login = async (
  username: string,
  password: string
): Promise<{ user: User; token: string }> => {
  try {
    const response = await apiClient.post('/auth/login', { username, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await apiClient.get('/users');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProjects = async (): Promise<Project[]> => {
  try {
    const response = await apiClient.get('/projects');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createProject = async (
  name: string,
  description: string
): Promise<Project> => {
  try {
    const response = await apiClient.post('/projects', { name, description });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addProjectMember = async (
  projectId: string,
  username: string
): Promise<Project> => {
  try {
    const response = await apiClient.post(`/projects/${projectId}/members`, { username });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getTaskUpdates = async (projectId: string): Promise<TaskUpdate[]> => {
  try {
    const response = await apiClient.get(`/projects/${projectId}/updates`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createTaskUpdate = async (
  projectId: string,
  data: {
    targetUserId: string;
    status: TaskStatus;
    note: string;
    tags: string[];
  }
): Promise<TaskUpdate> => {
  try {
    const response = await apiClient.post(`/projects/${projectId}/updates`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getWeeklyReport = async (projectId: string): Promise<WeeklyReport[]> => {
  try {
    const response = await apiClient.get(`/projects/${projectId}/weekly-report`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default apiClient;
