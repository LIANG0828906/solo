import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Repair, Stats, Notification, UserRole } from '../types';

interface AppContextType {
  repairs: Repair[];
  setRepairs: React.Dispatch<React.SetStateAction<Repair[]>>;
  stats: Stats | null;
  setStats: React.Dispatch<React.SetStateAction<Stats | null>>;
  role: UserRole;
  setRole: (role: UserRole) => void;
  repairerName: string;
  setRepairerName: (name: string) => void;
  notifications: Notification[];
  addNotification: (type: Notification['type'], message: string) => void;
  removeNotification: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [role, setRole] = useState<UserRole>('user');
  const [repairerName, setRepairerName] = useState<string>('');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((type: Notification['type'], message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <AppContext.Provider value={{
      repairs,
      setRepairs,
      stats,
      setStats,
      role,
      setRole,
      repairerName,
      setRepairerName,
      notifications,
      addNotification,
      removeNotification
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
