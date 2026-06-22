import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { User, LendingRecord } from '../types';
import {
  login,
  fetchUserRecords,
  reserveBook as apiReserveBook,
  returnBook as apiReturnBook,
  renewBook as apiRenewBook,
  cancelReservation as apiCancelReservation,
} from '../utils/api';

interface LendingContextType {
  currentUser: User | null;
  records: LendingRecord[];
  isLoading: boolean;
  error: string | null;
  notification: { type: 'success' | 'error' | 'info'; message: string } | null;
  loginUser: (userId: string) => Promise<void>;
  logout: () => void;
  reserveBook: (bookId: string) => Promise<LendingRecord | null>;
  returnBook: (recordId: string) => Promise<void>;
  renewBook: (recordId: string) => Promise<LendingRecord | null>;
  cancelReservation: (recordId: string) => Promise<void>;
  refreshRecords: () => Promise<void>;
  setNotification: (notification: { type: 'success' | 'error' | 'info'; message: string } | null) => void;
}

const LendingContext = createContext<LendingContextType | undefined>(undefined);

export function LendingProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [records, setRecords] = useState<LendingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showNotification = useCallback(
    (type: 'success' | 'error' | 'info', message: string) => {
      setNotification({ type, message });
      setTimeout(() => setNotification(null), 3000);
    },
    []
  );

  const refreshRecords = useCallback(async () => {
    if (!currentUser) return;
    try {
      const response = await fetchUserRecords(currentUser.id);
      if (response.success) {
        setRecords(response.data);
      }
    } catch (err: any) {
      console.error('刷新借阅记录失败:', err);
    }
  }, [currentUser]);

  const loginUser = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await login(userId);
      if (response.success) {
        setCurrentUser(response.data.user);
        setRecords(response.data.records || []);
        showNotification('success', `欢迎回来，${response.data.user.name}！`);
      }
    } catch (err: any) {
      setError(err.message);
      showNotification('error', err.message || '登录失败');
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setRecords([]);
    showNotification('info', '已退出登录');
  }, [showNotification]);

  const reserveBook = useCallback(
    async (bookId: string): Promise<LendingRecord | null> => {
      if (!currentUser) {
        showNotification('error', '请先登录后再预约图书');
        return null;
      }
      setIsLoading(true);
      try {
        const response = await apiReserveBook(currentUser.id, bookId);
        if (response.success) {
          setRecords(prev => [response.data, ...prev]);
          showNotification('success', response.message || '预约成功');
          return response.data;
        }
        return null;
      } catch (err: any) {
        showNotification('error', err.message || '预约失败');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [currentUser, showNotification]
  );

  const returnBook = useCallback(
    async (recordId: string) => {
      setIsLoading(true);
      try {
        const response = await apiReturnBook(recordId);
        if (response.success) {
          setRecords(prev =>
            prev.map(r => (r.id === recordId ? { ...response.data } : r))
          );
          showNotification('success', response.message || '归还成功');
        }
      } catch (err: any) {
        showNotification('error', err.message || '归还失败');
      } finally {
        setIsLoading(false);
      }
    },
    [showNotification]
  );

  const renewBook = useCallback(
    async (recordId: string): Promise<LendingRecord | null> => {
      setIsLoading(true);
      try {
        const response = await apiRenewBook(recordId);
        if (response.success) {
          setRecords(prev =>
            prev.map(r => (r.id === recordId ? response.data : r))
          );
          showNotification('success', response.message || '续借成功');
          return response.data;
        }
        return null;
      } catch (err: any) {
        showNotification('error', err.message || '续借失败');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [showNotification]
  );

  const cancelReservation = useCallback(
    async (recordId: string) => {
      setIsLoading(true);
      try {
        const response = await apiCancelReservation(recordId);
        if (response.success) {
          setRecords(prev => prev.filter(r => r.id !== recordId));
          showNotification('success', response.message || '预约已取消');
        }
      } catch (err: any) {
        showNotification('error', err.message || '取消预约失败');
      } finally {
        setIsLoading(false);
      }
    },
    [showNotification]
  );

  useEffect(() => {
    const initUser = async () => {
      await loginUser('user-001');
    };
    initUser();
  }, []);

  const value: LendingContextType = {
    currentUser,
    records,
    isLoading,
    error,
    notification,
    loginUser,
    logout,
    reserveBook,
    returnBook,
    renewBook,
    cancelReservation,
    refreshRecords,
    setNotification,
  };

  return (
    <LendingContext.Provider value={value}>
      {children}
    </LendingContext.Provider>
  );
}

export function useLending() {
  const context = useContext(LendingContext);
  if (context === undefined) {
    throw new Error('useLending must be used within a LendingProvider');
  }
  return context;
}

export default LendingContext;
