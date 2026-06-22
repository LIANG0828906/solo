import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Task, TaskStatus, TaskState } from '../types';
import { localStorageAdapter } from '../persistence/localStorageAdapter';

const STORAGE_KEY = 'task-state';

interface TaskStore extends TaskState {
  addTask: (zoneId: string, name: string, deadline: number, assignee: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  reorderTask: (taskId: string, targetZoneId: string, newPriority: number) => void;
  moveTask: (taskId: string, targetZoneId: string) => void;
  getTasksByZone: (zoneId: string) => Task[];
  getPendingTasks: () => Task[];
  loadFromStorage: () => void;
  persist: () => void;
}

const getInitialState = (): TaskState => {
  const stored = localStorageAdapter.get<TaskState | null>(STORAGE_KEY, null);
  if (stored) {
    return stored;
  }
  return {
    tasks: [],
  };
};

export const useTaskStore = create<TaskStore>((set, get) => ({
  ...getInitialState(),

  addTask: (zoneId: string, name: string, deadline: number, assignee: string) => {
    const zoneTasks = get().tasks.filter((t) => t.zoneId === zoneId);
    const maxPriority = zoneTasks.length > 0 
      ? Math.max(...zoneTasks.map((t) => t.priority)) 
      : 0;
    
    const newTask: Task = {
      id: uuidv4(),
      zoneId,
      name,
      deadline,
      assignee,
      status: 'pending',
      priority: maxPriority + 1,
      createdAt: Date.now(),
    };
    set((state) => ({
      tasks: [...state.tasks, newTask],
    }));
    get().persist();
  },

  updateTask: (id: string, updates: Partial<Task>) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, ...updates } : task
      ),
    }));
    get().persist();
  },

  deleteTask: (id: string) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    }));
    get().persist();
  },

  completeTask: (id: string) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, status: 'completed' as TaskStatus } : task
      ),
    }));
    get().persist();
  },

  reorderTask: (taskId: string, targetZoneId: string, newPriority: number) => {
    set((state) => {
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task) return state;

      let updatedTasks = state.tasks.map((t) => {
        if (t.id === taskId) {
          return { ...t, zoneId: targetZoneId, priority: newPriority };
        }
        if (t.zoneId === targetZoneId && t.id !== taskId && t.priority >= newPriority) {
          return { ...t, priority: t.priority + 1 };
        }
        return t;
      });

      if (task.zoneId !== targetZoneId) {
        updatedTasks = updatedTasks.map((t) => {
          if (t.zoneId === task.zoneId && t.priority > task.priority) {
            return { ...t, priority: t.priority - 1 };
          }
          return t;
        });
      }

      return { tasks: updatedTasks };
    });
    get().persist();
  },

  moveTask: (taskId: string, targetZoneId: string) => {
    const targetTasks = get().tasks.filter((t) => t.zoneId === targetZoneId);
    const newPriority = targetTasks.length + 1;
    get().reorderTask(taskId, targetZoneId, newPriority);
  },

  getTasksByZone: (zoneId: string) => {
    return get()
      .tasks.filter((task) => task.zoneId === zoneId)
      .sort((a, b) => {
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (a.status !== 'completed' && b.status === 'completed') return -1;
        return a.priority - b.priority;
      });
  },

  getPendingTasks: () => {
    return get().tasks.filter((task) => task.status === 'pending');
  },

  loadFromStorage: () => {
    const stored = localStorageAdapter.get<TaskState | null>(STORAGE_KEY, null);
    if (stored) {
      set(stored);
    }
  },

  persist: () => {
    const state = get();
    localStorageAdapter.set<TaskState>(STORAGE_KEY, {
      tasks: state.tasks,
    });
  },
}));
