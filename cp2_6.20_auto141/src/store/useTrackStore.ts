import { create } from 'zustand';
import { TrackData, TrackCell } from '../types';

interface TrackState {
  tracks: TrackData[];
  currentTrackId: string | null;
  selectedCell: { x: number; y: number } | null;
  loadTracks: () => void;
  saveTrack: (name: string, cells: TrackCell[], width: number, height: number) => string;
  deleteTrack: (id: string) => void;
  setCurrentTrackId: (id: string | null) => void;
  setSelectedCell: (cell: { x: number; y: number } | null) => void;
  getCurrentTrack: () => TrackData | undefined;
  updateCell: (trackId: string, cell: TrackCell) => void;
}

const STORAGE_KEY = 'tracks';

export const useTrackStore = create<TrackState>((set, get) => ({
  tracks: [],
  currentTrackId: null,
  selectedCell: null,

  loadTracks: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        set({ tracks: JSON.parse(stored) });
      }
    } catch (e) {
      console.error('Failed to load tracks from localStorage', e);
    }
  },

  saveTrack: (name, cells, width, height) => {
    const id = Date.now().toString();
    const newTrack: TrackData = {
      id,
      name,
      width,
      height,
      cells,
      createdAt: Date.now(),
    };
    const tracks = [...get().tracks, newTrack];
    set({ tracks });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
    return id;
  },

  deleteTrack: (id) => {
    const tracks = get().tracks.filter((t) => t.id !== id);
    set({ tracks });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
  },

  setCurrentTrackId: (id) => set({ currentTrackId: id }),

  setSelectedCell: (cell) => set({ selectedCell: cell }),

  getCurrentTrack: () => {
    const { tracks, currentTrackId } = get();
    return tracks.find((t) => t.id === currentTrackId);
  },

  updateCell: (trackId, cell) => {
    const tracks = get().tracks.map((track) => {
      if (track.id !== trackId) return track;
      const cellIndex = track.cells.findIndex((c) => c.x === cell.x && c.y === cell.y);
      const cells = [...track.cells];
      if (cellIndex >= 0) {
        cells[cellIndex] = cell;
      } else {
        cells.push(cell);
      }
      return { ...track, cells };
    });
    set({ tracks });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
  },
}));
