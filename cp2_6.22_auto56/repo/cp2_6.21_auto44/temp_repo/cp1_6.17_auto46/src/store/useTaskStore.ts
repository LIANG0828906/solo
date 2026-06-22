import { create } from 'zustand';
import { Task, Stats, StatsParams } from '../types';

interface TaskState {
  tasks: Task[];
  stats: Stats[];
  loading: boolean;
  searchKeyword: string;
  fetchTasks: () => Promise<void>;
  fetchStats: (params?: StatsParams) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'status' | 'actualHours'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  updateStatus: (id: string, status: Task['status']) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setSearchKeyword: (keyword: string) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  stats: [],
  loading: false,
  searchKeyword: '',

  fetchTasks: async () => {
    set({ loading: true });
    try {
      const response = await fetch('/api/tasks');
      const data = await response.json();
      set({ tasks: data });
    } catch (error) {
      console.error('获取任务失败:', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchStats: async (params?: StatsParams) => {
    set({ loading: true });
    try {
      const queryParams = new URLSearchParams();
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      if (params?.person) queryParams.append('person', params.person);

      const url = `/api/stats${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      set({ stats: data });
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      set({ loading: false });
    }
  },

  addTask: async (task) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      const newTask = await response.json();
      set((state) => ({
        tasks: [newTask, ...state.tasks],
      }));
    } catch (error) {
      console.error('添加任务失败:', error);
    }
  },

  updateTask: async (id, updates) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const updatedTask = await response.json();
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
      }));
    } catch (error) {
      console.error('更新任务失败:', error);
    }
  },

  updateStatus: async (id, status) => {
    await get().updateTask(id, { status });
  },

  deleteTask: async (id) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      }));
    } catch (error) {
      console.error('删除任务失败:', error);
    }
  },

  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
}));
