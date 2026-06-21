export interface Task {
  id: string;
  description: string;
  type: 'daily' | 'shopping' | 'study';
  lat: number;
  lng: number;
  completed: boolean;
  createdAt: string;
  completedAt: string | null;
}

export interface CreateTaskPayload {
  description: string;
  type: 'daily' | 'shopping' | 'study';
  lat: number;
  lng: number;
}

const API_BASE = '/api';

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch(`${API_BASE}/tasks`);
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
}

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create task');
  }
  return res.json();
}

export async function completeTask(id: string): Promise<Task> {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed: true }),
  });
  if (!res.ok) throw new Error('Failed to complete task');
  return res.json();
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete task');
}
