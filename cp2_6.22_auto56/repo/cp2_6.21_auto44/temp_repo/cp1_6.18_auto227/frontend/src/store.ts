import { create } from 'zustand';
import { Task, UserCursor, Notification } from './types';

interface AppState {
  tasks: Task[];
  cursors: Record<string, UserCursor>;
  notifications: Notification[];
  selectedTaskId: string | null;
  currentUserId: string;
  zoom: number;
  panOffset: number;
  hoveredTaskId: string | null;

  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  setSelectedTaskId: (id: string | null) => void;
  setCursor: (cursor: UserCursor) => void;
  removeCursor: (userId: string) => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: number) => void;
  setHoveredTaskId: (id: string | null) => void;
}

const generateUserId = () => {
  return 'user_' + Math.random().toString(36).substr(2, 9);
};

export const useAppStore = create<AppState>((set) => ({
  tasks: [],
  cursors: {},
  notifications: [],
  selectedTaskId: null,
  currentUserId: generateUserId(),
  zoom: 1,
  panOffset: 0,
  hoveredTaskId: null,

  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (task) => set((state) => ({
    tasks: state.tasks.map((t) => (t.id === task.id ? task : t))
  })),
  deleteTask: (id) => set((state) => ({
    tasks: state.tasks.filter((t) => t.id !== id)
  })),
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),
  setCursor: (cursor) => set((state) => ({
    cursors: { ...state.cursors, [cursor.userId]: cursor }
  })),
  removeCursor: (userId) => set((state) => {
    const newCursors = { ...state.cursors };
    delete newCursors[userId];
    return { cursors: newCursors };
  }),
  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, notification]
  })),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id)
  })),
  setZoom: (zoom) => set({ zoom: Math.max(0.3, Math.min(3, zoom)) }),
  setPanOffset: (offset) => set({ panOffset: offset }),
  setHoveredTaskId: (id) => set({ hoveredTaskId: id })
}));
