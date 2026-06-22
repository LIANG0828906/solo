import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import type { User, Order } from '@/types';

interface AppContextValue {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  focusedOrder: Order | null;
  setFocusedOrder: (order: Order | null) => void;
  showNotification: (message: string, type?: 'success' | 'error') => void;
  notification: { message: string; type: 'success' | 'error' } | null;
}

const defaultUser: User = {
  id: 'U005',
  name: '孙管理',
  role: 'manager',
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(defaultUser);
  const [focusedOrder, setFocusedOrder] = useState<Order | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const showNotification = useCallback(
    (message: string, type: 'success' | 'error' = 'success') => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 3000);
    },
    []
  );

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        focusedOrder,
        setFocusedOrder,
        showNotification,
        notification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
