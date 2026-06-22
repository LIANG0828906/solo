import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, login as apiLogin, register as apiRegister, addFavorite, removeFavorite } from '../api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  toggleFavorite: (recipeId: string) => Promise<void>;
  isFavorite: (recipeId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const userData = await apiLogin(username, password);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const register = async (username: string, password: string) => {
    const userData = await apiRegister(username, password);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const toggleFavorite = async (recipeId: string) => {
    if (!user) return;

    try {
      if (user.favorites.includes(recipeId)) {
        const result = await removeFavorite(user.id, recipeId);
        setUser({ ...user, favorites: result.favorites });
        localStorage.setItem('user', JSON.stringify({ ...user, favorites: result.favorites }));
      } else {
        const result = await addFavorite(user.id, recipeId);
        setUser({ ...user, favorites: result.favorites });
        localStorage.setItem('user', JSON.stringify({ ...user, favorites: result.favorites }));
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      throw error;
    }
  };

  const isFavorite = (recipeId: string) => {
    return user ? user.favorites.includes(recipeId) : false;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, toggleFavorite, isFavorite }}>
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
