import { create } from 'zustand';
import type { SportEvent, User, Bet } from './types';
import {
  fetchEvents,
  fetchLeaderboard,
  fetchCurrentUser,
  fetchUserBets,
  placeBet,
  settleEvent,
  updateEventStatus,
} from './api';

interface AppState {
  events: SportEvent[];
  leaderboard: User[];
  currentUser: User | null;
  userBets: Bet[];
  loading: boolean;
  error: string | null;
  settlingEvents: Set<string>;
  animatedUsers: Set<string>;

  loadEvents: () => Promise<void>;
  loadLeaderboard: () => Promise<void>;
  loadCurrentUser: () => Promise<void>;
  loadUserBets: () => Promise<void>;
  loadAll: () => Promise<void>;

  submitBet: (eventId: string, optionId: string, amount: number) => Promise<{ success: boolean; message?: string }>;
  processEventSettlement: (eventId: string) => Promise<string[]>;
  markEventLive: (eventId: string) => void;
  markAnimatedUser: (userId: string) => void;
  clearAnimatedUser: (userId: string) => void;

  getBetForEvent: (eventId: string) => Bet | undefined;
}

export const useAppStore = create<AppState>((set, get) => ({
  events: [],
  leaderboard: [],
  currentUser: null,
  userBets: [],
  loading: false,
  error: null,
  settlingEvents: new Set(),
  animatedUsers: new Set(),

  loadEvents: async () => {
    set({ loading: true });
    try {
      const res = await fetchEvents();
      if (res.success && res.data) {
        set({ events: res.data });
      }
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  loadLeaderboard: async () => {
    try {
      const res = await fetchLeaderboard();
      if (res.success && res.data) {
        set({ leaderboard: res.data });
      }
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  loadCurrentUser: async () => {
    try {
      const res = await fetchCurrentUser();
      if (res.success && res.data) {
        set({ currentUser: res.data });
      }
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  loadUserBets: async () => {
    const user = get().currentUser;
    if (!user) return;
    try {
      const res = await fetchUserBets(user.id);
      if (res.success && res.data) {
        set({ userBets: res.data });
      }
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  loadAll: async () => {
    set({ loading: true });
    try {
      await Promise.all([
        get().loadEvents(),
        get().loadLeaderboard(),
        get().loadCurrentUser(),
      ]);
      await get().loadUserBets();
    } finally {
      set({ loading: false });
    }
  },

  submitBet: async (eventId: string, optionId: string, amount: number) => {
    const user = get().currentUser;
    if (!user) return { success: false, message: '用户未登录' };

    const res = await placeBet({
      userId: user.id,
      eventId,
      optionId,
      amount,
    });

    if (res.success) {
      await Promise.all([
        get().loadCurrentUser(),
        get().loadUserBets(),
        get().loadLeaderboard(),
      ]);
      return { success: true };
    }
    return { success: false, message: res.message };
  },

  processEventSettlement: async (eventId: string) => {
    const settling = get().settlingEvents;
    if (settling.has(eventId)) return [];

    const newSettling = new Set(settling);
    newSettling.add(eventId);
    set({ settlingEvents: newSettling });

    try {
      const res = await settleEvent(eventId);
      if (res.success && res.data) {
        const winners = res.data.winners;
        for (const winnerId of winners) {
          get().markAnimatedUser(winnerId);
        }
        await Promise.all([
          get().loadEvents(),
          get().loadLeaderboard(),
          get().loadCurrentUser(),
          get().loadUserBets(),
        ]);
        setTimeout(() => {
          for (const winnerId of winners) {
            get().clearAnimatedUser(winnerId);
          }
        }, 2000);
        return winners;
      }
      return [];
    } finally {
      const updated = new Set(get().settlingEvents);
      updated.delete(eventId);
      set({ settlingEvents: updated });
    }
  },

  markEventLive: (eventId: string) => {
    updateEventStatus(eventId, 'live');
    void get().loadEvents();
  },

  markAnimatedUser: (userId: string) => {
    const updated = new Set(get().animatedUsers);
    updated.add(userId);
    set({ animatedUsers: updated });
  },

  clearAnimatedUser: (userId: string) => {
    const updated = new Set(get().animatedUsers);
    updated.delete(userId);
    set({ animatedUsers: updated });
  },

  getBetForEvent: (eventId: string) => {
    return get().userBets.find(b => b.eventId === eventId);
  },
}));
