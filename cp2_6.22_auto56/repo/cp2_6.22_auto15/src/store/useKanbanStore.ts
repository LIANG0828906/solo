import { create } from 'zustand';
import type { Task, Sprint, ActivityEntry, OnlineUser } from '../../shared/types';

interface KanbanState {
  tasks: Task[];
  sprint: Sprint | null;
  activities: ActivityEntry[];
  onlineUsers: OnlineUser[];
  currentUser: OnlineUser | null;
  selectedTask: Task | null;
  modalOpen: boolean;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  setSprint: (sprint: Sprint | null) => void;
  addActivity: (activity: ActivityEntry) => void;
  setOnlineUsers: (users: OnlineUser[]) => void;
  addOnlineUser: (user: OnlineUser) => void;
  removeOnlineUser: (id: string) => void;
  setCurrentUser: (user: OnlineUser | null) => void;
  selectTask: (task: Task | null) => void;
  setModalOpen: (open: boolean) => void;
}

const useKanbanStore = create<KanbanState>()((set) => ({
  tasks: [],
  sprint: null,
  activities: [],
  onlineUsers: [],
  currentUser: null,
  selectedTask: null,
  modalOpen: false,
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      selectedTask:
        state.selectedTask?.id === id
          ? { ...state.selectedTask, ...updates }
          : state.selectedTask,
    })),
  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      selectedTask: state.selectedTask?.id === id ? null : state.selectedTask,
    })),
  setSprint: (sprint) => set({ sprint }),
  addActivity: (activity) =>
    set((state) => ({ activities: [activity, ...state.activities] })),
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  addOnlineUser: (user) =>
    set((state) => ({ onlineUsers: [...state.onlineUsers, user] })),
  removeOnlineUser: (id) =>
    set((state) => ({
      onlineUsers: state.onlineUsers.filter((u) => u.id !== id),
    })),
  setCurrentUser: (user) => set({ currentUser: user }),
  selectTask: (task) => set({ selectedTask: task }),
  setModalOpen: (open) => set({ modalOpen: open }),
}));

export default useKanbanStore;
