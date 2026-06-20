import { create } from 'zustand';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
  avatar_url: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

const getToken = (): string | null => {
  return localStorage.getItem('yujing_token');
};

const setToken = (token: string) => {
  localStorage.setItem('yujing_token', token);
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

const removeToken = () => {
  localStorage.removeItem('yujing_token');
  delete axios.defaults.headers.common['Authorization'];
};

const initToken = getToken();
if (initToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${initToken}`;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: initToken,
  isAuthenticated: !!initToken,
  isLoading: false,

  login: async (username, password) => {
    set({ isLoading: true });
    try {
      const response = await axios.post('/api/auth/login', { username, password });
      const { access_token } = response.data;
      setToken(access_token);
      set({ token: access_token, isAuthenticated: true, isLoading: false });
      await useAuthStore.getState().fetchMe();
    } catch (error: any) {
      set({ isLoading: false });
      throw error.response?.data?.detail || 'Login failed';
    }
  },

  register: async (username, email, password) => {
    set({ isLoading: true });
    try {
      const response = await axios.post('/api/auth/register', { username, email, password });
      const { access_token } = response.data;
      setToken(access_token);
      set({ token: access_token, isAuthenticated: true, isLoading: false });
      await useAuthStore.getState().fetchMe();
    } catch (error: any) {
      set({ isLoading: false });
      throw error.response?.data?.detail || 'Registration failed';
    }
  },

  logout: () => {
    removeToken();
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    try {
      const response = await axios.get('/api/auth/me');
      set({ user: response.data });
    } catch (error) {
      removeToken();
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));
