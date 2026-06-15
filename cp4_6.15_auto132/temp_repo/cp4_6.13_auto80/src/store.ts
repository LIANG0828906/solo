import { create } from 'zustand';

export interface User {
  id: string;
  username: string;
  avatar: string;
  points: number;
}

export interface Skill {
  id: string;
  user_id: string;
  skill_name: string;
  skill_type: string;
  description: string;
  requirement: string;
  time_slots: string | TimeSlot[];
  status: 'active' | 'inactive';
  created_at: string;
  provider?: User;
}

export interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
  repeat?: 'weekly' | 'biweekly';
}

export interface Exchange {
  id: string;
  skill_id: string;
  requester_id: string;
  provider_id: string;
  exchange_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  points: number;
  created_at: string;
  otherUser?: User;
  skill?: Skill;
  isRequester?: boolean;
}

export interface Transaction {
  id: string;
  user_id: string;
  exchange_id: string;
  amount: number;
  type: 'earn' | 'spend';
  description: string;
  created_at: string;
}

interface AppState {
  user: User | null;
  token: string | null;
  skills: Skill[];
  mySkills: Skill[];
  exchanges: Exchange[];
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  fetchProfile: () => Promise<void>;
  fetchMySkills: () => Promise<void>;
  fetchAllSkills: () => Promise<void>;
  fetchExchanges: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  createSkill: (skill: Partial<Skill>) => Promise<Skill | null>;
  updateSkill: (id: string, skill: Partial<Skill>) => Promise<Skill | null>;
  deleteSkill: (id: string) => Promise<boolean>;
  createExchange: (skillId: string, exchangeTime: string) => Promise<Exchange | null>;
  updateExchangeStatus: (id: string, status: string) => Promise<Exchange | null>;
  logout: () => void;
}

const API_BASE = '/api';

const getHeaders = (token: string | null) => ({
  'Content-Type': 'application/json',
  ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
});

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  skills: [],
  mySkills: [],
  exchanges: [],
  transactions: [],
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '登录失败');
      
      set({ user: data.user, token: data.token, isLoading: false });
      localStorage.setItem('token', data.token);
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  register: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '注册失败');
      
      set({ user: data.user, token: data.token, isLoading: false });
      localStorage.setItem('token', data.token);
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  fetchProfile: async () => {
    const { token } = get();
    if (!token) return;
    
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_BASE}/users/profile`, {
        headers: getHeaders(token),
      });
      const data = await res.json();
      if (res.ok) {
        set({ user: data, isLoading: false });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchMySkills: async () => {
    const { token } = get();
    if (!token) return;
    
    try {
      const res = await fetch(`${API_BASE}/skills/my`, {
        headers: getHeaders(token),
      });
      const data = await res.json();
      if (res.ok) {
        set({ mySkills: data });
      }
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchAllSkills: async () => {
    const { token } = get();
    if (!token) return;
    
    try {
      const res = await fetch(`${API_BASE}/skills`, {
        headers: getHeaders(token),
      });
      const data = await res.json();
      if (res.ok) {
        set({ skills: data });
      }
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchExchanges: async () => {
    const { token } = get();
    if (!token) return;
    
    try {
      const res = await fetch(`${API_BASE}/skills/exchanges`, {
        headers: getHeaders(token),
      });
      const data = await res.json();
      if (res.ok) {
        set({ exchanges: data });
      }
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchTransactions: async () => {
    const { token } = get();
    if (!token) return;
    
    try {
      const res = await fetch(`${API_BASE}/skills/transactions`, {
        headers: getHeaders(token),
      });
      const data = await res.json();
      if (res.ok) {
        set({ transactions: data });
      }
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  createSkill: async (skill) => {
    const { token } = get();
    if (!token) return null;
    
    try {
      const res = await fetch(`${API_BASE}/skills`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(skill),
      });
      const data = await res.json();
      if (res.ok) {
        const { mySkills } = get();
        set({ mySkills: [data, ...mySkills] });
        return data;
      }
      throw new Error(data.error);
    } catch (err: any) {
      set({ error: err.message });
      return null;
    }
  },

  updateSkill: async (id, skill) => {
    const { token } = get();
    if (!token) return null;
    
    try {
      const res = await fetch(`${API_BASE}/skills/${id}`, {
        method: 'PUT',
        headers: getHeaders(token),
        body: JSON.stringify(skill),
      });
      const data = await res.json();
      if (res.ok) {
        const { mySkills } = get();
        set({ 
          mySkills: mySkills.map(s => s.id === id ? data : s) 
        });
        return data;
      }
      throw new Error(data.error);
    } catch (err: any) {
      set({ error: err.message });
      return null;
    }
  },

  deleteSkill: async (id) => {
    const { token } = get();
    if (!token) return false;
    
    try {
      const res = await fetch(`${API_BASE}/skills/${id}`, {
        method: 'DELETE',
        headers: getHeaders(token),
      });
      if (res.ok) {
        const { mySkills } = get();
        set({ 
          mySkills: mySkills.filter(s => s.id !== id) 
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  createExchange: async (skillId, exchangeTime) => {
    const { token } = get();
    if (!token) return null;
    
    try {
      const res = await fetch(`${API_BASE}/skills/exchanges`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify({ skill_id: skillId, exchange_time: exchangeTime }),
      });
      const data = await res.json();
      if (res.ok) {
        const { exchanges } = get();
        set({ exchanges: [data, ...exchanges] });
        return data;
      }
      throw new Error(data.error);
    } catch (err: any) {
      set({ error: err.message });
      return null;
    }
  },

  updateExchangeStatus: async (id, status) => {
    const { token } = get();
    if (!token) return null;
    
    try {
      const res = await fetch(`${API_BASE}/skills/exchanges/${id}/status`, {
        method: 'PUT',
        headers: getHeaders(token),
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) {
        const { exchanges } = get();
        set({ 
          exchanges: exchanges.map(e => e.id === id ? { ...e, status: data.status } : e) 
        });
        return data;
      }
      throw new Error(data.error);
    } catch (err: any) {
      set({ error: err.message });
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, skills: [], mySkills: [], exchanges: [], transactions: [] });
  },
}));
