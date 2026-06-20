import { create } from 'zustand';

export interface User {
  id: string;
  username: string;
  avatar?: string;
  created_at?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  init: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: (user: User, token: string) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    set({
      user,
      token,
      isAuthenticated: true,
    });
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  init: () => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');
    let user: User | null = null;

    if (userStr) {
      try {
        user = JSON.parse(userStr) as User;
      } catch {
        user = null;
      }
    }

    if (token && user) {
      set({
        user,
        token,
        isAuthenticated: true,
      });
    } else {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    }
  },
}));

export default useAuthStore;
