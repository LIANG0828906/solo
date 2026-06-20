import { create } from 'zustand';
import type { ColumnData, TaskData, LogEntry } from '../types';
import { projectApi } from '../api/projectApi';

interface BoardState {
  columns: ColumnData[];
  tasks: TaskData[];
  logs: LogEntry[];
  loading: boolean;
  error: string | null;

  fetchData: () => Promise<void>;
  fetchLogs: () => Promise<void>;
  createTask: (data: Parameters<typeof projectApi.createTask>['0']) => Promise<TaskData>;
  updateTask: (id: string, data: Parameters<typeof projectApi.updateTask>['1']) => Promise<TaskData>;
  moveTask: (data: Parameters<typeof projectApi.moveTask>['0']) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  getColumnTasks: (columnId: string) => TaskData[];
  getTaskById: (id: string) => TaskData | undefined;
  isTaskBlocked: (taskId: string) => boolean;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  columns: [],
  tasks: [],
  logs: [],
  loading: false,
  error: null,

  fetchData: async () => {
    set({ loading: true, error: null });
    try {
      const [columns, tasks] = await Promise.all([
        projectApi.getColumns(),
        projectApi.getTasks(),
      ]);
      set({ columns, tasks, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  fetchLogs: async () => {
    try {
      const logs = await projectApi.getLogs(200);
      set({ logs });
    } catch {
      // ignore
    }
  },

  createTask: async (data) => {
    const task = await projectApi.createTask(data);
    set((state) => ({ tasks: [...state.tasks, task] }));
    await get().fetchLogs();
    return task;
  },

  updateTask: async (id, data) => {
    const updated = await projectApi.updateTask(id, data);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
    }));
    await get().fetchLogs();
    return updated;
  },

  moveTask: async (data) => {
    await projectApi.moveTask(data);
    await get().fetchData();
    await get().fetchLogs();
  },

  deleteTask: async (id) => {
    await projectApi.deleteTask(id);
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));
    await get().fetchLogs();
  },

  getColumnTasks: (columnId) => {
    return get()
      .tasks.filter((t) => t.column_id === columnId)
      .sort((a, b) => a.order - b.order);
  },

  getTaskById: (id) => get().tasks.find((t) => t.id === id),

  isTaskBlocked: (taskId) => {
    const task = get().getTaskById(taskId);
    if (!task || task.dependencies.length === 0) return false;
    return task.dependencies.some((depId) => {
      const dep = get().getTaskById(depId);
      return dep && dep.column_id !== 'col-done';
    });
  },
}));
