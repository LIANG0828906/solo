import { create } from 'zustand';
import type { User } from '@/shared/types';
import { createUser, getUserByNickname } from '@/modules/backend/data/cafeData';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (nickname: string) => Promise<User>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const STORAGE_KEY = 'flavorfusion_current_user';

function loadUserFromStorage(): User | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as User;
    }
  } catch {
    // ignore
  }
  return null;
}

function saveUserToStorage(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: loadUserFromStorage(),
  isLoading: false,

  login: async (nickname: string) => {
    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      throw new Error('昵称不能为空');
    }

    let user = await getUserByNickname(trimmedNickname);

    if (!user) {
      user = await createUser({
        nickname: trimmedNickname,
        isOwner: false,
      });
    }

    saveUserToStorage(user);
    set({ user });
    return user;
  },

  logout: () => {
    saveUserToStorage(null);
    set({ user: null });
  },

  setUser: (user) => {
    saveUserToStorage(user);
    set({ user });
  },
}));
