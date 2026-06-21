import type { User, Project, Task, StudyRecord, ApiResponse } from '../types';

const API_BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return res.json();
}

export const api = {
  getUser: () => request<User>('/user'),
  updateUser: (data: Partial<User>) =>
    request<User>('/user', { method: 'PUT', body: JSON.stringify(data) }),

  getProjects: () => request<Project[]>('/projects'),
  createProject: (data: { name: string; color: string }) =>
    request<Project>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: string, data: Partial<Project>) =>
    request<Project>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id: string) => request<void>(`/projects/${id}`, { method: 'DELETE' }),

  addTask: (projectId: string, data: { name: string; estimatedMinutes: number; deadline: string }) =>
    request<Task>(`/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTask: (id: string, data: Partial<Task>) =>
    request<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTask: (id: string) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),

  getRecords: (params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    const qs = query.toString();
    return request<StudyRecord[]>(`/records${qs ? `?${qs}` : ''}`);
  },
  saveRecord: (data: { date: string; content: string; minutes: number; projectId?: string }) =>
    request<StudyRecord>('/records', { method: 'POST', body: JSON.stringify(data) }),
  deleteRecord: (id: string) => request<void>(`/records/${id}`, { method: 'DELETE' }),
};
