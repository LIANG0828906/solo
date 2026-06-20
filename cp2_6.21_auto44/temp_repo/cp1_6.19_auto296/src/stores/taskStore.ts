import { create } from 'zustand';
import type { Task, TaskStatus } from '../types';
import api from '../utils/api';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (id: string, newStatus: TaskStatus) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  fetchTasks: async () => {
    set({ loading: true });
    try {
      const response = await api.get<Task[]>('/tasks');
      set({ tasks: response.data });
    } finally {
      set({ loading: false });
    }
  },
  addTask: async (task) => {
    const response = await api.post<Task>('/tasks', task);
    set({
      tasks: [...get().tasks, response.data],
    });
  },
  updateTask: async (id, updates) => {
    const response = await api.patch<Task>(`/tasks/${id}`, updates);
    set({
      tasks: get().tasks.map((t) => (t.id === id ? response.data : t)),
    });
  },
  deleteTask: async (id) => {
    await api.delete(`/tasks/${id}`);
    set({
      tasks: get().tasks.filter((t) => t.id !== id),
    });
  },
  moveTask: async (id, newStatus) => {
    const response = await api.patch<Task>(`/tasks/${id}`, { status: newStatus });
    set({
      tasks: get().tasks.map((t) => (t.id === id ? response.data : t)),
    });
  },
}));
