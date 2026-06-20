import axios from 'axios';
import type { Task, Lane, Note, Priority } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchAllData = async (): Promise<{ tasks: Task[]; lanes: Lane[] }> => {
  const response = await api.get('/tasks');
  return response.data;
};

export const updateTask = async (
  taskId: string,
  updates: Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'dueDate' | 'assignee' | 'tags' | 'order'>>,
): Promise<Task> => {
  const response = await api.put(`/tasks/${taskId}`, updates);
  return response.data;
};

export const addNote = async (
  taskId: string,
  content: string,
  author: string,
): Promise<Note> => {
  const response = await api.post(`/tasks/${taskId}/notes`, { content, author });
  return response.data;
};

export const createTask = async (
  title: string,
  status: string,
  priority: Priority = 'medium',
): Promise<Task> => {
  const response = await api.post('/tasks', { title, status, priority });
  return response.data;
};

export const deleteTask = async (taskId: string): Promise<{ success: boolean }> => {
  const response = await api.delete(`/tasks/${taskId}`);
  return response.data;
};

export const fetchLanes = async (): Promise<Lane[]> => {
  const response = await api.get('/lanes');
  return response.data;
};

export const createLane = async (title: string): Promise<Lane> => {
  const response = await api.post('/lanes', { title });
  return response.data;
};

export const updateLane = async (laneId: string, title: string): Promise<Lane> => {
  const response = await api.put(`/lanes/${laneId}`, { title });
  return response.data;
};

export const deleteLane = async (laneId: string): Promise<{ success: boolean }> => {
  const response = await api.delete(`/lanes/${laneId}`);
  return response.data;
};

export default api;
