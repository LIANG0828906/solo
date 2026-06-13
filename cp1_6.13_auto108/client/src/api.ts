import axios from 'axios';
import type { Task, Tag, Priority, TaskStatus } from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

export async function fetchTasks(): Promise<Task[]> {
  const response = await api.get('/tasks');
  return response.data.tasks;
}

export async function fetchTags(): Promise<Tag[]> {
  const response = await api.get('/tags');
  return response.data.tags;
}

export interface CreateTaskData {
  title: string;
  description: string;
  tags: Tag[];
  priority: Priority;
}

export async function createTask(data: CreateTaskData): Promise<Task> {
  const response = await api.post('/tasks', data);
  return response.data.task;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  tags?: Tag[];
  priority?: Priority;
  status?: TaskStatus;
  order?: number;
}

export async function updateTask(id: string, data: UpdateTaskData): Promise<Task> {
  const response = await api.put(`/tasks/${id}`, data);
  return response.data.task;
}

export interface ReorderData {
  sourceStatus: TaskStatus;
  sourceIndex: number;
  destinationStatus: TaskStatus;
  destinationIndex: number;
}

export async function reorderTasks(data: ReorderData): Promise<Task[]> {
  const response = await api.post('/tasks/reorder', data);
  return response.data.tasks;
}

export async function addComment(taskId: string, content: string): Promise<Task> {
  const response = await api.post(`/tasks/${taskId}/comments`, { content });
  return response.data.task;
}
