import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/types';
import { login as apiLogin, logout as apiLogout, getMe } from '@/api/client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
  });

  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await getMe();
        setState({ user, isAuthenticated: true, loading: false });
      } catch {
        setState({ user: null, isAuthenticated: false, loading: false });
      }
    };
    initAuth();
  }, []);

  const login = useCallback(async (username: string) => {
    const user = await apiLogin(username);
    setState({ user, isAuthenticated: true, loading: false });
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setState({ user: null, isAuthenticated: false, loading: false });
    }
  }, []);

  return {
    ...state,
    login,
    logout,
  };
}
