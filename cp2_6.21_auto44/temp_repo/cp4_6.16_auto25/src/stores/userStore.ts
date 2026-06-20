import { create } from 'zustand';
import type { User } from '@/types';
import { getUser, saveUser } from '@/utils/idb';

interface UserStore {
  user: User | null;
  loading: boolean;
  initialized: boolean;

  fetchUser: () => Promise<void>;
  setUser: (user: User) => Promise<void>;
  updateUserName: (name: string) => Promise<void>;
}

const AVATAR_COLORS = [
  '#8B5E3C',
  '#D2B48C',
  '#4CAF50',
  '#2196F3',
  '#FF9800',
  '#9C27B0',
  '#F44336',
  '#009688',
];

function getRandomColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

function getDefaultUser(): User {
  return {
    name: '匿名书友',
    avatarColor: getRandomColor(),
  };
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  loading: false,
  initialized: false,

  fetchUser: async () => {
    set({ loading: true });
    try {
      let user = await getUser();
      if (!user) {
        user = getDefaultUser();
        await saveUser(user);
      }
      set({ user, initialized: true });
    } finally {
      set({ loading: false });
    }
  },

  setUser: async (user) => {
    set({ user });
    await saveUser(user);
  },

  updateUserName: async (name) => {
    const currentUser = get().user;
    if (!currentUser) return;

    const updatedUser: User = {
      ...currentUser,
      name,
    };
    set({ user: updatedUser });
    await saveUser(updatedUser);
  },
}));
