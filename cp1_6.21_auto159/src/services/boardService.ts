import axios from 'axios';
import type { Board, Task, TaskPriority } from '@/types';

const api = axios.create({ baseURL: '/api' });

export const getBoards = (): Promise<Board[]> =>
  api.get<Board[]>('/boards').then((r) => r.data);

export const createBoard = (data: { name: string; description: string }): Promise<Board> =>
  api.post<Board>('/boards', data).then((r) => r.data);

export const getBoardById = (id: string): Promise<Board> =>
  api.get<Board>(`/boards/${id}`).then((r) => r.data);

export const deleteBoard = (id: string): Promise<void> =>
  api.delete(`/boards/${id}`).then(() => {});

export const getTasksByBoard = (boardId: string): Promise<Task[]> =>
  api.get<Task[]>(`/boards/${boardId}/tasks`).then((r) => r.data);

export const createTask = (
  boardId: string,
  data: { title: string; description: string; assignee: string; priority: TaskPriority },
): Promise<Task> =>
  api.post<Task>(`/boards/${boardId}/tasks`, data).then((r) => r.data);

export const updateTask = (id: string, data: Partial<Task>): Promise<Task> =>
  api.patch<Task>(`/tasks/${id}`, data).then((r) => r.data);

export const deleteTask = (id: string): Promise<void> =>
  api.delete(`/tasks/${id}`).then(() => {});
