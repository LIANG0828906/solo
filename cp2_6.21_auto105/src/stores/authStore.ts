import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  avatar: string;
  bio?: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (username: string, password: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    void password;
    const user: User = {
      id: '1',
      username,
      avatar: `https://picsum.photos/seed/${username}/100/100`,
      bio: '热爱旅行，探索世界',
    };
    set({ user, isAuthenticated: true });
    return true;
  },
  register: async (username: string, password: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    void password;
    const user: User = {
      id: '1',
      username,
      avatar: `https://picsum.photos/seed/${username}/100/100`,
      bio: '热爱旅行，探索世界',
    };
    set({ user, isAuthenticated: true });
    return true;
  },
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
}));
