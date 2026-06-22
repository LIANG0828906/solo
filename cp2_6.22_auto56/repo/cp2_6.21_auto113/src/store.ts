import { create } from 'zustand';
import type { User, Task, TaskStatus, ToastItem, TaskPriority } from './types';

interface BoardStore {
  currentUser: User | null;
  tasks: Task[];
  filters: { status?: TaskStatus; reviewerId?: string; priority?: TaskPriority | 'all' };
  toasts: ToastItem[];
  setCurrentUser: (u: User) => void;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  setFilters: (f: Partial<BoardStore['filters']>) => void;
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

let toastCounter = 0;

export const useBoardStore = create<BoardStore>((set, get) => ({
  currentUser: null,
  tasks: [],
  filters: { priority: 'all' },
  toasts: [],

  setCurrentUser: (u) => set({ currentUser: u }),
  setTasks: (tasks) => set({ tasks }),

  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),

  updateTask: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates, updatedAt: updates.updatedAt || new Date().toISOString() } : t
      ),
    })),

  deleteTask: (taskId) =>
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) })),

  setFilters: (f) => set((state) => ({ filters: { ...state.filters, ...f } })),

  addToast: (toast) => {
    const id = `toast-${++toastCounter}`;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      get().removeToast(id);
    }, 3000);
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
