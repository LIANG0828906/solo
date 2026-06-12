import axios from 'axios';
import type { Project, Task, Priority, TaskStatus } from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const projectApi = {
  getAll: () => api.get<Project[]>('/projects').then(r => r.data),
  getById: (id: string) => api.get<Project>(`/projects/${id}`).then(r => r.data),
};

export const taskApi = {
  create: (data: { projectId: string; title: string; description: string; dueDate: string; priority: Priority }) =>
    api.post<Task>('/tasks', data).then(r => r.data),
  updateStatus: (id: string, status: TaskStatus) =>
    api.patch<Task>(`/tasks/${id}/status`, { status }).then(r => r.data),
  reorder: (projectId: string, taskIds: string[]) =>
    api.post<void>('/tasks/reorder', { projectId, taskIds }).then(r => r.data),
};
