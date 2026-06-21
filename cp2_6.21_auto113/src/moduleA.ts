import axios from 'axios';
import type { CreateTaskPayload, Task, TaskStatus, User } from './types';
import { useBoardStore } from './store';

const api = axios.create({ baseURL: '/api', timeout: 10000 });

function selectLeastBusyReviewer(reviewers: User[]): User | null {
  const online = reviewers.filter((r) => r.isOnline);
  if (online.length === 0) return null;
  online.sort((a, b) => a.activeTasks - b.activeTasks || a.id.localeCompare(b.id));
  return online[0];
}

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  try {
    let reviewers: User[] = [];
    try {
      const res = await api.get<User[]>('/reviewers');
      reviewers = res.data;
    } catch {
      reviewers = [];
    }

    const chosen = selectLeastBusyReviewer(reviewers);
    const finalPayload: CreateTaskPayload & { reviewerId?: string } = {
      ...payload,
      reviewerId: chosen?.id,
    };

    const { data } = await api.post<Task>('/tasks', finalPayload);
    useBoardStore.getState().addToast({
      message: `任务已创建，分配给${data.reviewer?.name || chosen?.name || '未分配'}`,
      type: 'success',
    });
    return data;
  } catch (err) {
    useBoardStore.getState().addToast({
      message: '任务创建失败，请重试',
      type: 'error',
    });
    throw err;
  }
}

export async function assignReviewer(taskId: string): Promise<User> {
  const { data } = await api.post<User>(`/tasks/${taskId}/assign`);
  return data;
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task> {
  try {
    const { data } = await api.patch<Task>(`/tasks/${taskId}/status`, { status });
    return data;
  } catch (err) {
    useBoardStore.getState().addToast({
      message: '状态更新失败',
      type: 'error',
    });
    throw err;
  }
}

export async function fetchTasks(): Promise<Task[]> {
  const { data } = await api.get<Task[]>('/tasks');
  return data;
}

export async function fetchReviewers(): Promise<User[]> {
  const { data } = await api.get<User[]>('/reviewers');
  return data;
}

export async function deleteTask(taskId: string): Promise<void> {
  await api.delete(`/tasks/${taskId}`);
}
