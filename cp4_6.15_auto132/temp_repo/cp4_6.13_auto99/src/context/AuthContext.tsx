import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../utils/api';

interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('beantrace_token');
    const savedUser = localStorage.getItem('beantrace_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const data = await api.post<{ token: string; user: User }>(
      '/auth/login',
      { username, password },
      { requiresAuth: false }
    );

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('beantrace_token', data.token);
    localStorage.setItem('beantrace_user', JSON.stringify(data.user));
  };

  const register = async (username: string, email: string, password: string) => {
    const data = await api.post<{ token: string; user: User }>(
      '/auth/register',
      { username, email, password },
      { requiresAuth: false }
    );

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('beantrace_token', data.token);
    localStorage.setItem('beantrace_user', JSON.stringify(data.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('beantrace_token');
    localStorage.removeItem('beantrace_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
