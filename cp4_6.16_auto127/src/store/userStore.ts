import { create } from 'zustand';
import type { UserState } from '../types';

interface UserStore extends UserState {
  setUser: (user: Partial<UserState>) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  userId: 'user-001',
  userName: '社区志愿者',
  isAdmin: true,

  setUser: (user) => set((state) => ({ ...state, ...user })),
}));
