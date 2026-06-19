import { create } from 'zustand';

export interface Track {
  id: string;
  coverId: string;
  albumTitle: string;
  artist: string;
  title: string;
  durationSec: number;
}

interface TrackState {
  tracks: Track[];
  isPlaying: boolean;
  currentTrackId: string | null;
  progress: number;
  addTrack: (track: Omit<Track, 'id'>) => void;
  removeTrack: (id: string) => void;
  removeTracksByCover: (coverId: string) => void;
  updateTrack: (id: string, patch: Partial<Track>) => void;
  reorderTracks: (orderedIds: string[]) => void;
  togglePlay: () => void;
  setCurrentTrack: (id: string | null) => void;
  setProgress: (progress: number) => void;
  stopPlayback: () => void;
}

export function parseDuration(text: string): number {
  const m = text.match(/^(\d+):([0-5]\d)$/);
  if (!m) return 0;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const useTrackStore = create<TrackState>((set, get) => ({
  tracks: [],
  isPlaying: false,
  currentTrackId: null,
  progress: 0,

  addTrack: (track) => {
    const tracks = get().tracks;
    const sameCover = tracks.filter(t => t.coverId === track.coverId);
    if (sameCover.length >= 3) return;
    const newTrack: Track = {
      ...track,
      id: `track-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };
    set({ tracks: [...tracks, newTrack] });
  },

  removeTrack: (id) => {
    const { tracks, currentTrackId } = get();
    const next = tracks.filter(t => t.id !== id);
    set({
      tracks: next,
      currentTrackId: currentTrackId === id ? next[0]?.id ?? null : currentTrackId,
    });
  },

  removeTracksByCover: (coverId) => {
    const { tracks, currentTrackId } = get();
    const next = tracks.filter(t => t.coverId !== coverId);
    const removedIds = tracks.filter(t => t.coverId === coverId).map(t => t.id);
    set({
      tracks: next,
      currentTrackId: removedIds.includes(currentTrackId ?? '')
        ? next[0]?.id ?? null
        : currentTrackId,
    });
  },

  updateTrack: (id, patch) => {
    set({
      tracks: get().tracks.map(t => (t.id === id ? { ...t, ...patch } : t)),
    });
  },

  reorderTracks: (orderedIds) => {
    const { tracks } = get();
    const map = new Map(tracks.map(t => [t.id, t]));
    const next = orderedIds
      .map(id => map.get(id))
      .filter(Boolean) as Track[];
    tracks.forEach(t => {
      if (!orderedIds.includes(t.id)) next.push(t);
    });
    set({ tracks: next });
  },

  togglePlay: () => {
    const { isPlaying, tracks, currentTrackId } = get();
    if (!isPlaying && tracks.length > 0) {
      set({
        isPlaying: true,
        currentTrackId: currentTrackId ?? tracks[0].id,
      });
    } else {
      set({ isPlaying: false });
    }
  },

  setCurrentTrack: (id) => set({ currentTrackId: id, progress: id ? 0 : get().progress }),

  setProgress: (progress) => set({ progress: Math.max(0, Math.min(1, progress)) }),

  stopPlayback: () => set({ isPlaying: false, progress: 0 }),
}));
