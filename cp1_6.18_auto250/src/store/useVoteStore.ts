import { create } from 'zustand';
import type { RoomState, TrendDataPoint } from '../types';

interface VoteStoreState {
  roomState: RoomState | null;
  trendData: TrendDataPoint[];
  currentUserId: string;
  loading: boolean;
  error: string | null;
  setRoomState: (state: RoomState | null) => void;
  updateRoomState: (partial: Partial<RoomState>) => void;
  setRemainingTime: (seconds: number) => void;
  setTrendData: (data: TrendDataPoint[]) => void;
  appendTrendPoint: (point: TrendDataPoint) => void;
  setCurrentUserId: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

function generateUserId(): string {
  const stored = localStorage.getItem('sl_user_id');
  if (stored) return stored;
  const newId = 'u_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  localStorage.setItem('sl_user_id', newId);
  return newId;
}

export const useVoteStore = create<VoteStoreState>((set) => ({
  roomState: null,
  trendData: [],
  currentUserId: generateUserId(),
  loading: false,
  error: null,

  setRoomState: (state) => set({ roomState: state }),

  updateRoomState: (partial) =>
    set((s) => ({
      roomState: s.roomState ? { ...s.roomState, ...partial } : s.roomState,
    })),

  setRemainingTime: (seconds) =>
    set((s) => ({
      roomState: s.roomState
        ? { ...s.roomState, remainingSeconds: seconds }
        : s.roomState,
    })),

  setTrendData: (data) => set({ trendData: data }),

  appendTrendPoint: (point) =>
    set((s) => ({ trendData: [...s.trendData, point] })),

  setCurrentUserId: (id) => set({ currentUserId: id }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  reset: () =>
    set({
      roomState: null,
      trendData: [],
      loading: false,
      error: null,
    }),
}));

export const selectUserVotedSongId = (state: VoteStoreState): string | null => {
  if (!state.roomState) return null;
  return state.roomState.userVotes[state.currentUserId] ?? null;
};
