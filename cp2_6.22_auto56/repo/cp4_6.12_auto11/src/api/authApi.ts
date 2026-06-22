import axios from 'axios';
import { User } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const login = async (username: string, password: string): Promise<User> => {
  const response = await api.post('/auth/login', { username, password });
  const user: User = response.data;
  localStorage.setItem('userId', String(user.id));
  localStorage.setItem('user', JSON.stringify(user));
  return user;
};

export const logout = (): void => {
  localStorage.removeItem('userId');
  localStorage.removeItem('user');
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
};
