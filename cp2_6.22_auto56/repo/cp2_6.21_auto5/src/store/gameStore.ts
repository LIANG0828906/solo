import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Track,
  PlayerRecord,
  Skin,
  Cell,
  CellType,
} from '../types';
import {
  GRID_WIDTH,
  GRID_HEIGHT,
} from '../types';

interface GameState {
  tracks: Track[];
  records: PlayerRecord[];
  currentSkin: Skin;
  selectedTrackId: string | null;
  nickname: string;

  saveTrack: (track: Track) => void;
  deleteTrack: (id: string) => void;
  selectTrack: (id: string | null) => void;
  submitRecord: (record: PlayerRecord) => void;
  setSkin: (skin: Skin) => void;
  setNickname: (name: string) => void;
  getRecordsForTrack: (trackId: string) => PlayerRecord[];
  getTrackById: (id: string) => Track | undefined;
  createEmptyTrack: (name: string) => Track;
}

const DEFAULT_SKIN: Skin = {
  bodyColor: '#00d9ff',
  accessory: 'none',
  accessoryStyle: 0,
};

function loadFromLocalStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) return JSON.parse(raw) as T;
  } catch {}
  return fallback;
}

function createEmptyGrid(): Cell[][] {
  const grid: Cell[][] = [];
  for (let y = 0; y < GRID_HEIGHT; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      row.push({ type: 'empty' as CellType, height: 1, multiplier: 1 });
    }
    grid.push(row);
  }
  return grid;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      tracks: loadFromLocalStorage<Track[]>('neon_parkour_tracks', []),
      records: loadFromLocalStorage<PlayerRecord[]>('neon_parkour_records', []),
      currentSkin: loadFromLocalStorage<Skin>('neon_parkour_skin', DEFAULT_SKIN),
      selectedTrackId: null,
      nickname: loadFromLocalStorage<string>('neon_parkour_nickname', 'Player'),

      saveTrack: (track) => {
        set((state) => {
          const idx = state.tracks.findIndex((t) => t.id === track.id);
          const tracks =
            idx >= 0
              ? state.tracks.map((t, i) => (i === idx ? track : t))
              : [...state.tracks, track];
          localStorage.setItem('neon_parkour_tracks', JSON.stringify(tracks));
          return { tracks };
        });
      },

      deleteTrack: (id) => {
        set((state) => {
          const tracks = state.tracks.filter((t) => t.id !== id);
          localStorage.setItem('neon_parkour_tracks', JSON.stringify(tracks));
          return { tracks };
        });
      },

      selectTrack: (id) => {
        set({ selectedTrackId: id });
      },

      submitRecord: (record) => {
        set((state) => {
          const records = [...state.records, record];
          localStorage.setItem('neon_parkour_records', JSON.stringify(records));
          return { records };
        });
      },

      setSkin: (skin) => {
        localStorage.setItem('neon_parkour_skin', JSON.stringify(skin));
        set({ currentSkin: skin });
      },

      setNickname: (name) => {
        localStorage.setItem('neon_parkour_nickname', JSON.stringify(name));
        set({ nickname: name });
      },

      getRecordsForTrack: (trackId) => {
        return get()
          .records.filter((r) => r.trackId === trackId)
          .sort((a, b) => a.time - b.time);
      },

      getTrackById: (id) => {
        return get().tracks.find((t) => t.id === id);
      },

      createEmptyTrack: (name) => {
        const track: Track = {
          id: crypto.randomUUID(),
          name,
          cells: createEmptyGrid(),
          width: GRID_WIDTH,
          height: GRID_HEIGHT,
          createdAt: Date.now(),
        };
        return track;
      },
    }),
    {
      name: 'neon_parkour_store',
      serialize: (state) => JSON.stringify(state),
      deserialize: (raw) => JSON.parse(raw),
    }
  )
);
