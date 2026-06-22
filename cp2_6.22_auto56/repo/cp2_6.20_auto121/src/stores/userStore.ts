import { create } from 'zustand';

interface User {
  id: string;
  nickname: string;
  avatar: string;
}

interface UserState {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  updateNickname: (nickname: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
  updateNickname: (nickname) =>
    set((state) => ({
      user: state.user ? { ...state.user, nickname } : null,
    })),
}));
