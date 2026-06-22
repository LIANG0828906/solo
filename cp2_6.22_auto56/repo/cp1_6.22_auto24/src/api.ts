import type { Board, BoardWithTasks, Task, CreateTaskData, UpdateTaskData } from './types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  getBoards: (): Promise<Board[]> => request<Board[]>('/boards'),

  createBoard: (name: string): Promise<Board> =>
    request<Board>('/boards', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  getBoard: (id: string): Promise<BoardWithTasks> =>
    request<BoardWithTasks>(`/boards/${id}`),

  deleteBoard: (id: string): Promise<{ success: boolean }> =>
    request<{ success: boolean }>(`/boards/${id}`, {
      method: 'DELETE',
    }),

  createTask: (boardId: string, data: CreateTaskData): Promise<Task> =>
    request<Task>(`/boards/${boardId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTask: (
    boardId: string,
    taskId: string,
    data: UpdateTaskData
  ): Promise<Task> =>
    request<Task>(`/boards/${boardId}/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteTask: (
    boardId: string,
    taskId: string
  ): Promise<{ success: boolean }> =>
    request<{ success: boolean }>(`/boards/${boardId}/tasks/${taskId}`, {
      method: 'DELETE',
    }),
};
