import { create } from 'zustand';
import { Track, Effects, User, RoomState } from './types';

interface StudioStore {
  currentUser: User | null;
  roomState: RoomState | null;
  isConnected: boolean;
  isConnecting: boolean;
  isExporting: boolean;
  error: string | null;
  ws: WebSocket | null;

  setCurrentUser: (user: User) => void;
  setRoomState: (state: RoomState) => void;
  updateRoomState: (partial: Partial<RoomState>) => void;
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setExporting: (exporting: boolean) => void;
  setError: (error: string | null) => void;
  setWs: (ws: WebSocket | null) => void;

  updateTrack: (track: Track) => void;
  deleteTrack: (trackId: string) => void;
  reorderTracks: (trackIds: string[]) => void;
  updateEffects: (effects: Effects) => void;
  setMasterVolume: (volume: number) => void;
  setPlaying: (isPlaying: boolean) => void;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  reset: () => void;
}

export const useStudioStore = create<StudioStore>((set, get) => ({
  currentUser: null,
  roomState: null,
  isConnected: false,
  isConnecting: false,
  isExporting: false,
  error: null,
  ws: null,

  setCurrentUser: (user) => set({ currentUser: user }),
  setRoomState: (state) => set({ roomState: state }),
  updateRoomState: (partial) =>
    set((s) => ({
      roomState: s.roomState ? { ...s.roomState, ...partial } : s.roomState,
    })),
  setConnected: (connected) => set({ isConnected: connected }),
  setConnecting: (connecting) => set({ isConnecting: connecting }),
  setExporting: (exporting) => set({ isExporting: exporting }),
  setError: (error) => set({ error }),
  setWs: (ws) => set({ ws }),

  updateTrack: (track) =>
    set((s) => {
      if (!s.roomState) return s;
      const tracks = s.roomState.tracks.map((t) =>
        t.id === track.id ? track : t
      );
      return { roomState: { ...s.roomState, tracks } };
    }),

  deleteTrack: (trackId) =>
    set((s) => {
      if (!s.roomState) return s;
      const tracks = s.roomState.tracks.filter((t) => t.id !== trackId);
      return { roomState: { ...s.roomState, tracks } };
    }),

  reorderTracks: (trackIds) =>
    set((s) => {
      if (!s.roomState) return s;
      const idMap = new Map(s.roomState.tracks.map((t, i) => [t.id, i]));
      const tracks = [...s.roomState.tracks].sort(
        (a, b) =>
          trackIds.indexOf(a.id) - trackIds.indexOf(b.id)
      );
      return { roomState: { ...s.roomState, tracks } };
    }),

  updateEffects: (effects) =>
    set((s) => {
      if (!s.roomState) return s;
      return { roomState: { ...s.roomState, effects } };
    }),

  setMasterVolume: (volume) =>
    set((s) => {
      if (!s.roomState) return s;
      return { roomState: { ...s.roomState, masterVolume: volume } };
    }),

  setPlaying: (isPlaying) =>
    set((s) => {
      if (!s.roomState) return s;
      return { roomState: { ...s.roomState, isPlaying } };
    }),

  addUser: (user) =>
    set((s) => {
      if (!s.roomState) return s;
      if (s.roomState.users.find((u) => u.id === user.id)) return s;
      return {
        roomState: {
          ...s.roomState,
          users: [...s.roomState.users, user],
        },
      };
    }),

  removeUser: (userId) =>
    set((s) => {
      if (!s.roomState) return s;
      return {
        roomState: {
          ...s.roomState,
          users: s.roomState.users.filter((u) => u.id !== userId),
        },
      };
    }),

  reset: () =>
    set({
      currentUser: null,
      roomState: null,
      isConnected: false,
      isConnecting: false,
      isExporting: false,
      error: null,
      ws: null,
    }),
}));
