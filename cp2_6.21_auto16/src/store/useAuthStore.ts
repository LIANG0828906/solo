import { create } from 'zustand';

interface User {
  username: string;
  avatar: string;
  wallet: number;
}

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  login: (username: string) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  login: (username: string) =>
    set({
      isLoggedIn: true,
      user: {
        username,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${username}`,
        wallet: 10000,
      },
    }),
  logout: () => set({ isLoggedIn: false, user: null }),
}));

export default useAuthStore;
