import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { findOrCreateUser, getUserById, subscribe, type User } from '../../shared/dataStore';

interface AuthContextType {
  user: User | null;
  login: (nickname: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('bookExchangeUser');
    if (stored) {
      const parsed = JSON.parse(stored) as User;
      return getUserById(parsed.id) || null;
    }
    return null;
  });

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      if (user) {
        const updated = getUserById(user.id);
        if (updated) {
          setUser(updated);
          localStorage.setItem('bookExchangeUser', JSON.stringify(updated));
        }
      }
    });
    return unsubscribe;
  }, [user]);

  const login = useCallback((nickname: string) => {
    const found = findOrCreateUser(nickname);
    setUser(found);
    localStorage.setItem('bookExchangeUser', JSON.stringify(found));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('bookExchangeUser');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
