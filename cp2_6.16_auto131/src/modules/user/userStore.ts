import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '@/utils/types';
import { getUsers, saveUsers, getCurrentUserId, setCurrentUserId } from '@/utils/db';

interface UserState {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  init: () => Promise<void>;
  login: (name: string) => Promise<User>;
  logout: () => Promise<void>;
  getUserById: (id: string) => User | undefined;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  currentUser: null,
  isLoading: true,

  init: async () => {
    set({ isLoading: true });
    try {
      const [users, currentUserId] = await Promise.all([
        getUsers(),
        getCurrentUserId(),
      ]);
      const currentUser = currentUserId
        ? users.find((u) => u.id === currentUserId) || null
        : null;
      set({ users, currentUser, isLoading: false });
    } catch (error) {
      console.error('Failed to init user store:', error);
      set({ isLoading: false });
    }
  },

  login: async (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('用户名不能为空');
    }

    const { users } = get();
    let user = users.find(
      (u) => u.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (!user) {
      user = {
        id: uuidv4(),
        name: trimmedName,
        createdAt: Date.now(),
      };
      const updatedUsers = [...users, user];
      await saveUsers(updatedUsers);
      set({ users: updatedUsers });
    }

    await setCurrentUserId(user.id);
    set({ currentUser: user });
    return user;
  },

  logout: async () => {
    await setCurrentUserId(null);
    set({ currentUser: null });
  },

  getUserById: (id: string) => {
    return get().users.find((u) => u.id === id);
  },
}));
