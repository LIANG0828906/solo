import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

export type UserGroup = 'all' | 'frontend' | 'backend' | 'design';
export type TimeRange = 7 | 14 | 30;
export type MoodLevel = 1 | 2 | 3 | 4 | 5;
export type EfficiencyLevel = 3 | 4 | 5;
export type ObstacleType = 'dependency' | 'technical' | 'resource' | null;
export type ListFilter = 'all' | 'has-obstacle' | 'high-rating' | 'low-rating';

export interface Feedback {
  id: string;
  userId: string;
  userName: string;
  userGroup: Exclude<UserGroup, 'all'>;
  mood: MoodLevel;
  content: string;
  obstacle: ObstacleType;
  efficiency: EfficiencyLevel;
  createdAt: string;
}

export interface StatsPoint {
  date: string;
  avgMood: number;
  avgEfficiency: number;
}

interface FeedbackContextValue {
  feedbacks: Feedback[];
  statsData: StatsPoint[];
  selectedGroup: UserGroup;
  selectedRange: TimeRange;
  listFilter: ListFilter;
  socket: Socket | null;
  addFeedback: (data: Omit<Feedback, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  setSelectedGroup: (g: UserGroup) => void;
  setSelectedRange: (r: TimeRange) => void;
  setListFilter: (f: ListFilter) => void;
  notification: { message: string; visible: boolean } | null;
  showNotification: (message: string) => void;
  hideNotification: () => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export const useFeedbackContext = () => {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedbackContext must be used within FeedbackProvider');
  return ctx;
};

export const FeedbackProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [statsData, setStatsData] = useState<StatsPoint[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup>('all');
  const [selectedRange, setSelectedRange] = useState<TimeRange>(7);
  const [listFilter, setListFilter] = useState<ListFilter>('all');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notification, setNotification] = useState<{ message: string; visible: boolean } | null>(null);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('new-feedback', (data: { message: string; userName: string }) => {
      showNotification(data.message);
      loadFeedbacks();
      loadStats(selectedGroup, selectedRange);
    });

    return () => {
      newSocket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFeedbacks = async () => {
    try {
      const res = await axios.get('/api/feedback');
      if (res.data.success) {
        setFeedbacks(res.data.data);
      }
    } catch (e) {
      console.error('Load feedbacks failed:', e);
    }
  };

  const loadStats = async (group: UserGroup, range: TimeRange) => {
    try {
      const res = await axios.get('/api/stats', { params: { group, range } });
      if (res.data.success) {
        setStatsData(res.data.data);
      }
    } catch (e) {
      console.error('Load stats failed:', e);
    }
  };

  useEffect(() => {
    loadFeedbacks();
    loadStats('all', 7);
  }, []);

  useEffect(() => {
    loadStats(selectedGroup, selectedRange);
  }, [selectedGroup, selectedRange]);

  const addFeedback = async (data: Omit<Feedback, 'id' | 'userId' | 'createdAt'>) => {
    try {
      const res = await axios.post('/api/feedback', data);
      if (res.data.success) {
        setFeedbacks((prev) => [res.data.data, ...prev]);
        loadStats(selectedGroup, selectedRange);
      }
    } catch (e) {
      console.error('Submit feedback failed:', e);
    }
  };

  const showNotification = (message: string) => {
    setNotification({ message, visible: true });
    setTimeout(() => {
      setNotification((prev) => (prev ? { ...prev, visible: false } : null));
      setTimeout(() => setNotification(null), 500);
    }, 2000);
  };

  const hideNotification = () => {
    setNotification(null);
  };

  return (
    <FeedbackContext.Provider
      value={{
        feedbacks,
        statsData,
        selectedGroup,
        selectedRange,
        listFilter,
        socket,
        addFeedback,
        setSelectedGroup,
        setSelectedRange,
        setListFilter,
        notification,
        showNotification,
        hideNotification,
      }}
    >
      {children}
    </FeedbackContext.Provider>
  );
};
