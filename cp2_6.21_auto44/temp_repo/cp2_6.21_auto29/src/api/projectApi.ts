import axios from 'axios';
import type {
  ColumnData, TaskData, TaskCreateInput, TaskUpdateInput,
  TaskMoveInput, LogEntry,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const projectApi = {
  getColumns: (): Promise<ColumnData[]> =>
    api.get('/columns').then((r) => r.data),

  getTasks: (): Promise<TaskData[]> =>
    api.get('/tasks').then((r) => r.data),

  createTask: (data: TaskCreateInput): Promise<TaskData> =>
    api.post('/tasks', data).then((r) => r.data),

  updateTask: (id: string, data: TaskUpdateInput): Promise<TaskData> =>
    api.put(`/tasks/${id}`, data).then((r) => r.data),

  moveTask: (data: TaskMoveInput): Promise<{ success: boolean }> =>
    api.post('/tasks/move', data).then((r) => r.data),

  deleteTask: (id: string): Promise<{ success: boolean }> =>
    api.delete(`/tasks/${id}`).then((r) => r.data),

  getLogs: (limit = 100, offset = 0): Promise<LogEntry[]> =>
    api.get('/logs', { params: { limit, offset } }).then((r) => r.data),

  createLog: (data: { operator: string; action_type: string; details?: string }): Promise<LogEntry> =>
    api.post('/logs', data).then((r) => r.data),
};

export default api;
