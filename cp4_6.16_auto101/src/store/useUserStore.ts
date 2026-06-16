import { create } from 'zustand';
import type { User } from '../types';
import { UserModule } from '../modules/user/UserModule';

interface UserState {
  currentUser: User | null;
  users: User[];
  isLoading: boolean;
  error: string | null;

  init: () => Promise<void>;
  register: (username: string, description?: string) => Promise<User>;
  login: (username: string) => Promise<User | null>;
  logout: () => Promise<void>;
  updateUser: (
    userId: string,
    data: Partial<Pick<User, 'username' | 'description'>>
  ) => Promise<User | null>;
  getUserById: (userId: string) => Promise<User | null>;
  loadAllUsers: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  currentUser: null,
  users: [],
  isLoading: false,
  error: null,

  init: async () => {
    set({ isLoading: true });
    try {
      const user = await UserModule.getCurrentUser();
      if (user) {
        set({ currentUser: user });
      }
      const allUsers = await UserModule.getAllUsers();
      set({ users: allUsers });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (username: string, description = '') => {
    set({ isLoading: true });
    try {
      const user = await UserModule.register(username, description);
      set({ currentUser: user });
      const allUsers = await UserModule.getAllUsers();
      set({ users: allUsers });
      return user;
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (username: string) => {
    set({ isLoading: true });
    try {
      const user = await UserModule.login(username);
      if (user) {
        set({ currentUser: user });
      }
      return user;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await UserModule.logout();
    set({ currentUser: null });
  },

  updateUser: async (userId, data) => {
    set({ isLoading: true });
    try {
      const user = await UserModule.updateUser(userId, data);
      if (user) {
        const { currentUser } = get();
        if (currentUser && currentUser.id === userId) {
          set({ currentUser: user });
        }
        const allUsers = await UserModule.getAllUsers();
        set({ users: allUsers });
      }
      return user;
    } finally {
      set({ isLoading: false });
    }
  },

  getUserById: async (userId: string) => {
    return UserModule.getUserById(userId);
  },

  loadAllUsers: async () => {
    const allUsers = await UserModule.getAllUsers();
    set({ users: allUsers });
  },
}));
