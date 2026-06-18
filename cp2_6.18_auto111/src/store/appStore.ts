import { create } from 'zustand';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
  participants: string[];
  category: string;
  organizer: string;
}

export interface User {
  id: string;
  name: string;
}

interface AppState {
  announcements: Announcement[];
  activities: Activity[];
  currentUser: User | null;
  users: User[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedCategory: string;
  serverTimeOffset: number;

  fetchAnnouncements: () => Promise<void>;
  fetchActivities: (category?: string) => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchServerTime: () => Promise<void>;
  createAnnouncement: (title: string, content: string) => Promise<Announcement | null>;
  joinActivity: (activityId: string, userId: string) => Promise<Activity | null>;
  leaveActivity: (activityId: string, userId: string) => Promise<Activity | null>;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  getFilteredAnnouncements: () => Announcement[];
  getFilteredActivities: () => Activity[];
  getAdjustedServerTime: () => number;
}

export const useAppStore = create<AppState>((set, get) => ({
  announcements: [],
  activities: [],
  currentUser: null,
  users: [],
  loading: false,
  error: null,
  searchQuery: '',
  selectedCategory: '全部',
  serverTimeOffset: 0,

  fetchAnnouncements: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/announcements');
      if (!response.ok) throw new Error('获取公告列表失败');
      const data = await response.json();
      set({ announcements: data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '未知错误', loading: false });
    }
  },

  fetchActivities: async (category?: string) => {
    set({ loading: true, error: null });
    try {
      const url = category 
        ? `/api/activities?category=${encodeURIComponent(category)}`
        : '/api/activities';
      const response = await fetch(url);
      if (!response.ok) throw new Error('获取活动列表失败');
      const data = await response.json();
      set({ activities: data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '未知错误', loading: false });
    }
  },

  fetchCurrentUser: async () => {
    try {
      const response = await fetch('/api/user/current');
      if (!response.ok) throw new Error('获取用户信息失败');
      const data = await response.json();
      set({ currentUser: data });
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  },

  fetchUsers: async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('获取用户列表失败');
      const data = await response.json();
      set({ users: data });
    } catch (error) {
      console.error('获取用户列表失败:', error);
    }
  },

  createAnnouncement: async (title: string, content: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '创建公告失败');
      }
      const newAnnouncement = await response.json();
      set(state => ({
        announcements: [newAnnouncement, ...state.announcements],
        loading: false
      }));
      return newAnnouncement;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '未知错误', loading: false });
      return null;
    }
  },

  joinActivity: async (activityId: string, userId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/activities/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId, userId })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '加入活动失败');
      }
      const updatedActivity = await response.json();
      set(state => ({
        activities: state.activities.map(a => 
          a.id === activityId ? updatedActivity : a
        ),
        loading: false
      }));
      return updatedActivity;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '未知错误', loading: false });
      return null;
    }
  },

  leaveActivity: async (activityId: string, userId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/activities/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId, userId })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '退出活动失败');
      }
      const updatedActivity = await response.json();
      set(state => ({
        activities: state.activities.map(a => 
          a.id === activityId ? updatedActivity : a
        ),
        loading: false
      }));
      return updatedActivity;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '未知错误', loading: false });
      return null;
    }
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setSelectedCategory: (category: string) => set({ selectedCategory: category }),

  fetchServerTime: async () => {
    try {
      const response = await fetch('/api/server-time');
      if (!response.ok) throw new Error('获取服务器时间失败');
      const data = await response.json();
      const serverTime = new Date(data.serverTime).getTime();
      const clientTime = Date.now();
      const offset = serverTime - clientTime;
      set({ serverTimeOffset: offset });
    } catch (error) {
      console.warn('获取服务器时间失败，将使用客户端时间:', error);
      set({ serverTimeOffset: 0 });
    }
  },

  getAdjustedServerTime: () => {
    const { serverTimeOffset } = get();
    return Date.now() + serverTimeOffset;
  },

  getFilteredAnnouncements: () => {
    const { announcements, searchQuery } = get();
    if (!searchQuery.trim()) return announcements;
    
    const query = searchQuery.toLowerCase();
    return announcements.filter(a => 
      a.title.toLowerCase().includes(query) || 
      a.content.toLowerCase().includes(query)
    );
  },

  getFilteredActivities: () => {
    const { activities, searchQuery, selectedCategory } = get();
    let filtered = activities;
    
    if (selectedCategory && selectedCategory !== '全部') {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(query) || 
        a.description.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }
}));
