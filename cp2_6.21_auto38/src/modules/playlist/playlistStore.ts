import { create } from 'zustand';

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
}

export interface CollabAction {
  type: 'add' | 'remove' | 'reorder';
  track?: Track;
  trackId?: string;
  fromIndex?: number;
  toIndex?: number;
}

interface PlaylistState {
  tracks: Track[];
  selectedTrackId: string | null;
  addTrack: (track: Track) => void;
  removeTrack: (trackId: string) => void;
  reorderTracks: (fromIndex: number, toIndex: number) => void;
  setSelectedTrack: (trackId: string | null) => void;
  applyRemoteAction: (action: CollabAction) => void;
}

let entryCounter = 0;

function generateEntryId(): string {
  entryCounter += 1;
  return `entry-${entryCounter}-${Date.now()}`;
}

export const usePlaylistStore = create<PlaylistState>((set) => ({
  tracks: [],
  selectedTrackId: null,

  addTrack: (track) =>
    set((state) => ({
      tracks: [...state.tracks, { ...track, id: generateEntryId() }],
    })),

  removeTrack: (trackId) =>
    set((state) => ({
      tracks: state.tracks.filter((t) => t.id !== trackId),
      selectedTrackId: state.selectedTrackId === trackId ? null : state.selectedTrackId,
    })),

  reorderTracks: (fromIndex, toIndex) =>
    set((state) => {
      const newTracks = [...state.tracks];
      const [removed] = newTracks.splice(fromIndex, 1);
      newTracks.splice(toIndex, 0, removed);
      return { tracks: newTracks };
    }),

  setSelectedTrack: (trackId) => set({ selectedTrackId: trackId }),

  applyRemoteAction: (action) =>
    set((state) => {
      switch (action.type) {
        case 'add':
          if (action.track) {
            return { tracks: [...state.tracks, { ...action.track, id: generateEntryId() }] };
          }
          return state;
        case 'remove':
          if (action.trackId) {
            return {
              tracks: state.tracks.filter((t) => t.id !== action.trackId),
              selectedTrackId: state.selectedTrackId === action.trackId ? null : state.selectedTrackId,
            };
          }
          return state;
        case 'reorder':
          if (action.fromIndex !== undefined && action.toIndex !== undefined) {
            const newTracks = [...state.tracks];
            const [removed] = newTracks.splice(action.fromIndex, 1);
            newTracks.splice(action.toIndex, 0, removed);
            return { tracks: newTracks };
          }
          return state;
        default:
          return state;
      }
    }),
}));

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const MOCK_TRACKS: Track[] = [
  { id: 'mock-1', title: 'Bohemian Rhapsody', artist: 'Queen', duration: 354 },
  { id: 'mock-2', title: 'Stairway to Heaven', artist: 'Led Zeppelin', duration: 482 },
  { id: 'mock-3', title: 'Hotel California', artist: 'Eagles', duration: 391 },
  { id: 'mock-4', title: 'Imagine', artist: 'John Lennon', duration: 187 },
  { id: 'mock-5', title: 'Smells Like Teen Spirit', artist: 'Nirvana', duration: 301 },
  { id: 'mock-6', title: 'Yesterday', artist: 'The Beatles', duration: 125 },
  { id: 'mock-7', title: 'Billie Jean', artist: 'Michael Jackson', duration: 294 },
  { id: 'mock-8', title: 'Sweet Child O Mine', artist: 'Guns N Roses', duration: 356 },
  { id: 'mock-9', title: 'Comfortably Numb', artist: 'Pink Floyd', duration: 382 },
  { id: 'mock-10', title: 'Under Pressure', artist: 'Queen & David Bowie', duration: 249 },
  { id: 'mock-11', title: 'Purple Rain', artist: 'Prince', duration: 520 },
  { id: 'mock-12', title: 'Back in Black', artist: 'AC/DC', duration: 255 },
  { id: 'mock-13', title: 'Lose Yourself', artist: 'Eminem', duration: 326 },
  { id: 'mock-14', title: 'Rolling in the Deep', artist: 'Adele', duration: 228 },
  { id: 'mock-15', title: 'Clocks', artist: 'Coldplay', duration: 307 },
  { id: 'mock-16', title: 'Creep', artist: 'Radiohead', duration: 238 },
  { id: 'mock-17', title: 'Wonderwall', artist: 'Oasis', duration: 258 },
  { id: 'mock-18', title: 'One', artist: 'U2', duration: 276 },
  { id: 'mock-19', title: 'November Rain', artist: 'Guns N Roses', duration: 537 },
  { id: 'mock-20', title: 'Shape of You', artist: 'Ed Sheeran', duration: 234 },
];
