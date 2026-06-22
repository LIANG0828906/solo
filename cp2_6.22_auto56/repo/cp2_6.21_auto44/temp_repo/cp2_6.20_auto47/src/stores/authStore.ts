import { create } from 'zustand';
import axios from 'axios';

interface AuthState {
  email: string;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  email: '',
  isLoggedIn: false,
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      await axios.post('/api/auth/login', { email, password });
      set({ email, isLoggedIn: true, isLoading: false });
    } catch {
      set({ isLoading: false });
      throw new Error('Login failed');
    }
  },

  logout: () => {
    set({ email: '', isLoggedIn: false });
  },
}));
