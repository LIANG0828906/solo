import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Item, Task, Activity } from '../types';

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
}

interface StoreState {
  user: User | null;
  token: string | null;
  items: Item[];
  tasks: Task[];
  activities: Activity[];
  loading: boolean;
  notifications: Notification[];
  setUser: (user: User | null) => void;
  logout: () => void;
  setItems: (items: Item[]) => void;
  setTasks: (tasks: Task[]) => void;
  setActivities: (activities: Activity[]) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'read'>) => void;
  removeNotification: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

const useStore = create<StoreState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      items: [],
      tasks: [],
      activities: [],
      loading: false,
      notifications: [],
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, token: null }),
      setItems: (items) => set({ items }),
      setTasks: (tasks) => set({ tasks }),
      setActivities: (activities) => set({ activities }),
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            ...state.notifications,
            { ...notification, id: Date.now().toString(), read: false },
          ],
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      setLoading: (loading) => set({ loading }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);

export default useStore;
