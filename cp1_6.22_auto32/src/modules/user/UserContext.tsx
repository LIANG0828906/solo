import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { api } from '@/utils/api';

interface AuthResponse extends User {
  token: string;
}

interface UserContextType {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  register: (username: string, password: string, nickname: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { nickname: string; bio: string }) => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const handleAuthResponse = (data: AuthResponse) => {
    localStorage.setItem('token', data.token);
    setCurrentUser({
      id: data.id,
      username: data.username,
      nickname: data.nickname,
      bio: data.bio,
    });
  };

  const register = async (username: string, password: string, nickname: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.users.register({ username, password, nickname }) as AuthResponse;
      handleAuthResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.users.login({ username, password }) as AuthResponse;
      handleAuthResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await api.users.logout();
    } catch (err) {
      console.error('Logout API error:', err);
    } finally {
      localStorage.removeItem('token');
      setCurrentUser(null);
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: { nickname: string; bio: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedUser = await api.users.updateProfile(data) as User;
      setCurrentUser(updatedUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const user = await api.users.getProfile() as User;
      setCurrentUser(user);
    } catch (_err) {
      localStorage.removeItem('token');
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <UserContext.Provider
      value={{
        currentUser,
        isLoading,
        error,
        register,
        login,
        logout,
        updateProfile,
        checkAuth,
        clearError,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
