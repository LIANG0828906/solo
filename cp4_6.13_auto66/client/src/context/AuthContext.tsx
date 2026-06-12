import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  User,
  UserProfile,
  LoginCredentials,
  RegisterCredentials,
  ApiError,
} from '../types';
import { authApi, profileApi } from '../services/api';

interface AuthContextType {
  user: User | UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  requireAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | UserProfile | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!token && !!user;

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (savedToken && savedUser) {
        try {
          setTokenState(savedToken);
          setUser(JSON.parse(savedUser));
          await refreshUserInternal();
        } catch {
          logoutInternal();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const logoutInternal = () => {
    authApi.logout();
    localStorage.removeItem('user');
    setUser(null);
    setTokenState(null);
  };

  const refreshUserInternal = async () => {
    try {
      const profile = await profileApi.getCurrent();
      setUser(profile);
      localStorage.setItem('user', JSON.stringify(profile));
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 401) {
        logoutInternal();
      }
    }
  };

  const refreshUser = async () => {
    setIsLoading(true);
    try {
      await refreshUserInternal();
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.login(credentials);
      setTokenState(response.token);
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
      await refreshUserInternal();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || '登录失败');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.register(credentials);
      setTokenState(response.token);
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
      await refreshUserInternal();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || '注册失败');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    logoutInternal();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const requireAuth = useCallback((): boolean => {
    if (!isAuthenticated) {
      return false;
    }
    return true;
  }, [isAuthenticated]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    refreshUser,
    requireAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
