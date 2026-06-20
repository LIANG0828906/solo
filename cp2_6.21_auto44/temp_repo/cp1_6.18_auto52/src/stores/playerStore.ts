import { create } from 'zustand';
import type { Song } from '@/services/apiService';

const MAX_HISTORY = 200;

interface PlayHistoryEntry {
  song: Song;
  playedAt: number;
}

interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  queueIndex: number;
  progress: number;
  duration: number;
  history: PlayHistoryEntry[];

  play: (song: Song, queue?: Song[], index?: number) => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  setProgress: (p: number) => void;
  setDuration: (d: number) => void;
  addHistory: (song: Song) => void;
  getRecentPlayed: () => PlayHistoryEntry[];
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  queue: [],
  queueIndex: -1,
  progress: 0,
  duration: 0,
  history: (() => {
    try {
      const raw = localStorage.getItem('sw_play_history');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  })(),

  play: (song, queue, index) => {
    const state = get();
    const newQueue = queue ?? [song];
    const newIndex = index ?? 0;
    set({
      currentSong: song,
      isPlaying: true,
      queue: newQueue,
      queueIndex: newIndex,
      progress: 0,
      duration: song.duration,
    });
    get().addHistory(song);
  },

  pause: () => set({ isPlaying: false }),

  togglePlay: () => {
    const s = get();
    if (!s.currentSong) return;
    set({ isPlaying: !s.isPlaying });
  },

  next: () => {
    const s = get();
    if (s.queue.length === 0) return;
    const ni = (s.queueIndex + 1) % s.queue.length;
    const ns = s.queue[ni];
    set({ currentSong: ns, queueIndex: ni, progress: 0, duration: ns.duration, isPlaying: true });
    get().addHistory(ns);
  },

  prev: () => {
    const s = get();
    if (s.queue.length === 0) return;
    const pi = s.queueIndex <= 0 ? s.queue.length - 1 : s.queueIndex - 1;
    const ps = s.queue[pi];
    set({ currentSong: ps, queueIndex: pi, progress: 0, duration: ps.duration, isPlaying: true });
    get().addHistory(ps);
  },

  setProgress: (p) => set({ progress: p }),
  setDuration: (d) => set({ duration: d }),

  addHistory: (song) => {
    const h = get().history.filter((e) => e.song.id !== song.id);
    h.unshift({ song, playedAt: Date.now() });
    const trimmed = h.slice(0, MAX_HISTORY);
    set({ history: trimmed });
    try {
      localStorage.setItem('sw_play_history', JSON.stringify(trimmed));
    } catch { /* ignore */ }
  },

  getRecentPlayed: () => get().history.slice(0, 5),
}));
