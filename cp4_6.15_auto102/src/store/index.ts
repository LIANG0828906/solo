import { create } from 'zustand';

interface UserInfo {
  id: string;
  name: string;
  avatar: string;
  points: number;
}

interface AppState {
  user: UserInfo;
  setUser: (user: Partial<UserInfo>) => void;
  addPoints: (amount: number) => void;
  deductPoints: (amount: number) => void;
}

export const useStore = create<AppState>((set) => ({
  user: {
    id: 'currentUser',
    name: '我',
    avatar: '',
    points: 520,
  },
  setUser: (user) =>
    set((state) => ({
      user: { ...state.user, ...user },
    })),
  addPoints: (amount) =>
    set((state) => ({
      user: { ...state.user, points: state.user.points + amount },
    })),
  deductPoints: (amount) =>
    set((state) => ({
      user: { ...state.user, points: Math.max(0, state.user.points - amount) },
    })),
}));
