import { create } from 'zustand';
import type { User } from '@/types';

interface AuthStore {
  token: string | null;
  user: User | null;
  isHydrated: boolean;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  updateUser: (user: User) => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  user: null,
  isHydrated: false,
  hydrate: () => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        set({ token, user, isHydrated: true });
        return;
      } catch {}
    }
    set({ isHydrated: true });
  },
  setAuth: (token, user) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    set({ token, user });
  },
  clearAuth: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    set({ token: null, user: null });
  },
  updateUser: (user) => {
    localStorage.setItem('auth_user', JSON.stringify(user));
    set({ user });
  },
}));

interface TimerStore {
  isRunning: boolean;
  isPaused: boolean;
  currentSubjectId: number | null;
  startTime: number | null;
  elapsedBeforePause: number;
  lastResumeTime: number;
  start: (subjectId: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => { subjectId: number; duration: number; startISO: string } | null;
  getElapsedMs: () => number;
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  isRunning: false,
  isPaused: false,
  currentSubjectId: null,
  startTime: null,
  elapsedBeforePause: 0,
  lastResumeTime: 0,
  start: (subjectId) => {
    const now = Date.now();
    set({
      isRunning: true,
      isPaused: false,
      currentSubjectId: subjectId,
      startTime: now,
      elapsedBeforePause: 0,
      lastResumeTime: now,
    });
  },
  pause: () => {
    const state = get();
    if (!state.isRunning || state.isPaused) return;
    const elapsed = state.elapsedBeforePause + (Date.now() - state.lastResumeTime);
    set({ isPaused: true, elapsedBeforePause: elapsed });
  },
  resume: () => {
    const state = get();
    if (!state.isRunning || !state.isPaused) return;
    set({ isPaused: false, lastResumeTime: Date.now() });
  },
  stop: () => {
    const state = get();
    if (!state.currentSubjectId || !state.startTime) {
      set({ isRunning: false, isPaused: false, currentSubjectId: null, startTime: null, elapsedBeforePause: 0, lastResumeTime: 0 });
      return null;
    }
    const duration = state.elapsedBeforePause + (state.isPaused ? 0 : Date.now() - state.lastResumeTime);
    const subjectId = state.currentSubjectId;
    const startISO = new Date(state.startTime).toISOString();
    set({ isRunning: false, isPaused: false, currentSubjectId: null, startTime: null, elapsedBeforePause: 0, lastResumeTime: 0 });
    return { subjectId, duration, startISO };
  },
  getElapsedMs: () => {
    const state = get();
    if (!state.isRunning) return 0;
    return state.elapsedBeforePause + (state.isPaused ? 0 : Date.now() - state.lastResumeTime);
  },
}));

interface UIStore {
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  timerExpanded: boolean;
  pendingAchievements: any[];
  setSidebarCollapsed: (v: boolean) => void;
  setMobileMenuOpen: (v: boolean) => void;
  setTimerExpanded: (v: boolean) => void;
  pushPendingAchievement: (a: any) => void;
  clearPendingAchievement: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  timerExpanded: false,
  pendingAchievements: [],
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setMobileMenuOpen: (v) => set({ mobileMenuOpen: v }),
  setTimerExpanded: (v) => set({ timerExpanded: v }),
  pushPendingAchievement: (a) =>
    set((s) => ({ pendingAchievements: [...s.pendingAchievements, a] })),
  clearPendingAchievement: () =>
    set((s) => ({ pendingAchievements: s.pendingAchievements.slice(1) })),
}));
