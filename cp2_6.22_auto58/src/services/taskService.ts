import axios from 'axios';
import { Task, TaskStatus, Priority } from '../types';

const API_BASE = '/api';

export const taskService = {
  async getAllTasks(): Promise<Task[]> {
    const response = await axios.get<Task[]>(`${API_BASE}/tasks`);
    return response.data;
  },

  async createTask(data: {
    title: string;
    status: TaskStatus;
    priority: Priority;
    estimatedHours: number;
  }): Promise<Task> {
    const response = await axios.post<Task>(`${API_BASE}/tasks`, data);
    return response.data;
  },

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    const response = await axios.put<Task>(`${API_BASE}/tasks/${id}`, data);
    return response.data;
  },

  async updateTaskStatus(id: string, status: TaskStatus, order?: number): Promise<Task> {
    const response = await axios.patch<Task>(`${API_BASE}/tasks/${id}/status`, { status, order });
    return response.data;
  },

  async incrementFocusCount(id: string): Promise<Task> {
    const response = await axios.patch<Task>(`${API_BASE}/tasks/${id}/focus`);
    return response.data;
  },

  async deleteTask(id: string): Promise<void> {
    await axios.delete(`${API_BASE}/tasks/${id}`);
  },
};
