import { create } from 'zustand';
import { useState, useEffect } from 'react';
import type { Activity, Expense, Debt, StoreState, RedPacket } from '@/types';

const API_BASE = '/api';

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    throw new Error('API request failed');
  }
  
  return response.json();
}

export const useStore = create<StoreState>((set, get) => ({
  activities: [],
  currentActivityId: null,
  loading: false,

  fetchActivities: async () => {
    set({ loading: true });
    try {
      const activities = await apiRequest<Activity[]>(`${API_BASE}/activities`);
      set({ activities });
    } finally {
      set({ loading: false });
    }
  },

  createActivity: async (name: string, participants: string[]) => {
    const newActivity = await apiRequest<Activity>(`${API_BASE}/activities`, {
      method: 'POST',
      body: JSON.stringify({ name, participants }),
    });
    set(state => ({
      activities: [...state.activities, newActivity],
    }));
    return newActivity;
  },

  updateActivity: async (id: string, data: Partial<Activity>) => {
    await apiRequest(`${API_BASE}/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    set(state => ({
      activities: state.activities.map(a =>
        a.id === id ? { ...a, ...data } : a
      ),
    }));
  },

  deleteActivity: async (id: string) => {
    await apiRequest(`${API_BASE}/activities/${id}`, {
      method: 'DELETE',
    });
    set(state => ({
      activities: state.activities.filter(a => a.id !== id),
      currentActivityId: state.currentActivityId === id ? null : state.currentActivityId,
    }));
  },

  setCurrentActivity: (id: string | null) => {
    set({ currentActivityId: id });
  },

  addExpense: async (activityId: string, expense: Omit<Expense, 'id' | 'timestamp'>) => {
    await apiRequest(`${API_BASE}/expenses/${activityId}`, {
      method: 'POST',
      body: JSON.stringify(expense),
    });
    await get().fetchActivities();
  },

  updateExpense: async (activityId: string, expenseId: string, data: Partial<Expense>) => {
    await apiRequest(`${API_BASE}/expenses/${activityId}/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    await get().fetchActivities();
  },

  deleteExpense: async (activityId: string, expenseId: string) => {
    await apiRequest(`${API_BASE}/expenses/${activityId}/${expenseId}`, {
      method: 'DELETE',
    });
    await get().fetchActivities();
  },

  sendRedPacket: async (activityId: string, packet: Omit<RedPacket, 'id' | 'timestamp'>) => {
    await apiRequest(`${API_BASE}/redpackets/${activityId}`, {
      method: 'POST',
      body: JSON.stringify(packet),
    });
    await get().fetchActivities();
  },

  getDebts: async (activityId: string): Promise<Debt[]> => {
    return apiRequest<Debt[]>(`${API_BASE}/settle/${activityId}`);
  },

  getParticipantById: (activityId: string, participantId: string) => {
    const activity = get().activities.find(a => a.id === activityId);
    return activity?.participants.find(p => p.id === participantId);
  },
}));

export const useCurrentActivity = () => {
  return useStore(state => {
    if (!state.currentActivityId) return null;
    return state.activities.find(a => a.id === state.currentActivityId) || null;
  });
};

export const useDebts = (activityId: string | null) => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activityId) return;
    setLoading(true);
    useStore.getState().getDebts(activityId)
      .then(setDebts)
      .finally(() => setLoading(false));
  }, [activityId, useStore.getState().activities]);

  return { debts, loading };
};
