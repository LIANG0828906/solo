import { create } from 'zustand';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  avatar: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loadFromStorage: () => void;
}

type AuthStore = AuthState & AuthActions;

const API_BASE = '/api';

function setAuthHeader(token: string | null) {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  login: async (username, password) => {
    const res = await axios.post(`${API_BASE}/auth/login`, { username, password });
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    setAuthHeader(token);
    set({ token, user, isAuthenticated: true });
  },

  register: async (username, password) => {
    const res = await axios.post(`${API_BASE}/auth/register`, { username, password });
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    setAuthHeader(token);
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    setAuthHeader(null);
    set({ token: null, user: null, isAuthenticated: false });
  },

  loadFromStorage: () => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthHeader(token);
      set({ token, isAuthenticated: true });
    }
  },
}));
