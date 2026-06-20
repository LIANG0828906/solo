import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User } from '../api';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  toast: (message: string, type?: Toast['type']) => void;
  toasts: Toast[];
  refreshUser: (user: User) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('eco_user');
      return saved ? (JSON.parse(saved) as User) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('eco_token'));
  const [toasts, setToasts] = useState<Toast[]>([]);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    if (u) {
      localStorage.setItem('eco_user', JSON.stringify(u));
    } else {
      localStorage.removeItem('eco_user');
    }
  }, []);

  const refreshUser = useCallback((u: User) => {
    setUserState(u);
    localStorage.setItem('eco_user', JSON.stringify(u));
  }, []);

  const login = useCallback((u: User, t: string) => {
    setUserState(u);
    setToken(t);
    localStorage.setItem('eco_user', JSON.stringify(u));
    localStorage.setItem('eco_token', t);
  }, []);

  const logout = useCallback(() => {
    setUserState(null);
    setToken(null);
    localStorage.removeItem('eco_user');
    localStorage.removeItem('eco_token');
  }, []);

  const toast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  }, []);

  const value: AppContextType = {
    user,
    setUser,
    token,
    login,
    logout,
    toast,
    toasts,
    refreshUser,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
