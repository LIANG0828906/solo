import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';

export interface User {
  id: string;
  name: string;
  color: string;
}

export interface Entry {
  id: string;
  userId: string;
  content: string;
  summary: string;
  timestamp: number;
  user?: User;
  relativeTime?: string;
}

export interface ArchiveWeek {
  week: string;
  weekLabel: string;
  totalEntries: number;
  contributorCount: number;
  lastEditTime: number;
  contributors: User[];
  entries?: Entry[];
}

export interface WeeklyReportContextType {
  users: User[];
  currentUser: User;
  setCurrentUser: (user: User) => void;
  entries: Entry[];
  addEntry: (content: string) => Promise<Entry | null>;
  fetchEntries: () => Promise<void>;
  fetchArchives: (week?: string) => Promise<ArchiveWeek[] | ArchiveWeek | null>;
  showError: (message: string) => void;
  archives: ArchiveWeek[];
}

export const USERS: User[] = [
  { id: 'user-1', name: '张三', color: '#EF4444' },
  { id: 'user-2', name: '李四', color: '#3B82F6' },
  { id: 'user-3', name: '王五', color: '#22C55E' },
];

const WeeklyReportContext = createContext<WeeklyReportContextType | undefined>(undefined);

export const WeeklyReportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users] = useState<User[]>(USERS);
  const [currentUser, setCurrentUser] = useState<User>(USERS[0]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [archives, setArchives] = useState<ArchiveWeek[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const showError = useCallback((message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 3000);
  }, []);

  const fetchEntries = useCallback(async () => {
    try {
      const response = await axios.get('/api/entries');
      setEntries(response.data);
    } catch (err) {
      showError('获取历史记录失败');
    }
  }, [showError]);

  const addEntry = useCallback(async (content: string): Promise<Entry | null> => {
    try {
      const response = await axios.post('/api/entries', {
        userId: currentUser.id,
        content
      });
      const newEntry: Entry = response.data;
      setEntries(prev => [newEntry, ...prev]);
      return newEntry;
    } catch (err) {
      showError('保存失败，请重试');
      return null;
    }
  }, [currentUser, showError]);

  const fetchArchives = useCallback(async (week?: string): Promise<ArchiveWeek[] | ArchiveWeek | null> => {
    try {
      const url = week ? `/api/archives?week=${week}` : '/api/archives';
      const response = await axios.get(url);
      if (week) {
        return response.data;
      }
      setArchives(response.data);
      return response.data;
    } catch (err) {
      showError('获取归档数据失败');
      return null;
    }
  }, [showError]);

  useEffect(() => {
    fetchEntries();
    fetchArchives();
  }, [fetchEntries, fetchArchives]);

  return (
    <WeeklyReportContext.Provider
      value={{
        users,
        currentUser,
        setCurrentUser,
        entries,
        addEntry,
        fetchEntries,
        fetchArchives,
        showError,
        archives,
      }}
    >
      {children}
      {errorMessage && <div className="toast-error">{errorMessage}</div>}
    </WeeklyReportContext.Provider>
  );
};

export const useWeeklyReport = () => {
  const context = useContext(WeeklyReportContext);
  if (context === undefined) {
    throw new Error('useWeeklyReport must be used within a WeeklyReportProvider');
  }
  return context;
};
