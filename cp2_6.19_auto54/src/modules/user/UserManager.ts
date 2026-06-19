import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { User, Notification } from '../../shared/types';
import { loadStorage, updateStorage } from '../../shared/storage';

interface AuthState {
  currentUser: User | null;
  users: User[];
  loginAsAdmin: (password: string) => boolean;
  loginAsReader: (name: string) => void;
  logout: () => void;
  isAdmin: () => boolean;
  isLoggedIn: () => boolean;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  clearOld: (days?: number) => void;
}

const ADMIN_PASSWORD = 'admin123';
const NOTIFICATION_CLEANUP_INTERVAL = 3600000;
const NOTIFICATION_EXPIRY_DAYS = 7;

const initialData = loadStorage();

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: initialData.auth.currentUserId
    ? initialData.auth.users.find((u) => u.id === initialData.auth.currentUserId) || null
    : null,
  users: initialData.auth.users,

  loginAsAdmin: (password: string) => {
    if (password !== ADMIN_PASSWORD) {
      return false;
    }
    let adminUser = get().users.find((u) => u.role === 'admin');
    if (!adminUser) {
      adminUser = {
        id: uuidv4(),
        name: '管理员',
        role: 'admin',
        createdAt: Date.now(),
      };
      const newUsers = [...get().users, adminUser];
      set({ users: newUsers });
      updateStorage('auth', { users: newUsers, currentUserId: adminUser.id });
    } else {
      updateStorage('auth', { users: get().users, currentUserId: adminUser.id });
    }
    set({ currentUser: adminUser });
    return true;
  },

  loginAsReader: (name: string) => {
    const trimmedName = name.trim();
    let readerUser = get().users.find((u) => u.name === trimmedName && u.role === 'reader');
    if (!readerUser) {
      readerUser = {
        id: uuidv4(),
        name: trimmedName,
        role: 'reader',
        createdAt: Date.now(),
      };
      const newUsers = [...get().users, readerUser];
      set({ users: newUsers });
      updateStorage('auth', { users: newUsers, currentUserId: readerUser.id });
    } else {
      updateStorage('auth', { users: get().users, currentUserId: readerUser.id });
    }
    set({ currentUser: readerUser });
  },

  logout: () => {
    set({ currentUser: null });
    updateStorage('auth', { users: get().users, currentUserId: null });
  },

  isAdmin: () => {
    return get().currentUser?.role === 'admin';
  },

  isLoggedIn: () => {
    return get().currentUser !== null;
  },
}));

export const useNotificationStore = create<NotificationState>((set, get) => {
  const cleanupTimer = setInterval(() => {
    get().clearOld();
  }, NOTIFICATION_CLEANUP_INTERVAL);

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      clearInterval(cleanupTimer);
    });
  }

  return {
    notifications: initialData.notifications,

    addNotification: (n) => {
      const notification: Notification = {
        ...n,
        id: uuidv4(),
        createdAt: Date.now(),
        read: false,
      };
      const newNotifications = [notification, ...get().notifications];
      set({ notifications: newNotifications });
      updateStorage('notifications', newNotifications);
    },

    markAsRead: (id) => {
      const newNotifications = get().notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      set({ notifications: newNotifications });
      updateStorage('notifications', newNotifications);
    },

    clearOld: (days: number = NOTIFICATION_EXPIRY_DAYS) => {
      const cutoff = Date.now() - days * 86400000;
      const newNotifications = get().notifications.filter((n) => n.createdAt > cutoff);
      if (newNotifications.length !== get().notifications.length) {
        set({ notifications: newNotifications });
        updateStorage('notifications', newNotifications);
      }
    },
  };
});
