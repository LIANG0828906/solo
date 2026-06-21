import { create } from 'zustand';

export interface Note {
  id: string;
  trackId: string;
  row: number;
  col: number;
  createdAt: number;
}

export interface Track {
  id: string;
  name: string;
  waveform: 'sine' | 'square' | 'sawtooth' | 'triangle';
  volume: number;
  pan: number;
  effectsEnabled: boolean;
}

export interface Project {
  id: string;
  name: string;
  creator: string;
  createdAt: string;
  inviteCode: string;
  tracks: Track[];
  notes: Note[];
}

interface AppState {
  projects: Project[];
  currentProject: Project | null;
  selectedTrackId: string | null;
  playhead: number;
  isPlaying: boolean;
  toasts: { id: string; message: string }[];

  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  setCurrentProject: (project: Project | null) => void;
  setSelectedTrackId: (id: string | null) => void;
  setPlayhead: (value: number | ((prev: number) => number)) => void;
  setIsPlaying: (value: boolean) => void;

  addNote: (note: Note) => void;
  removeNote: (noteId: string) => void;

  addTrack: (track: Track) => void;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  removeTrack: (trackId: string) => void;

  addToast: (message: string) => void;
  removeToast: (id: string) => void;
}

export const useStore = create<AppState>((set) => ({
  projects: [],
  currentProject: null,
  selectedTrackId: null,
  playhead: 0,
  isPlaying: false,
  toasts: [],

  setProjects: (projects) => set({ projects }),
  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),
  setCurrentProject: (project) =>
    set({ currentProject: project, selectedTrackId: project?.tracks[0]?.id ?? null }),
  setSelectedTrackId: (id) => set({ selectedTrackId: id }),
  setPlayhead: (value) =>
    set((state) => ({
      playhead: typeof value === 'function' ? value(state.playhead) : value,
    })),
  setIsPlaying: (value) => set({ isPlaying: value }),

  addNote: (note) =>
    set((state) => {
      if (!state.currentProject) return state;
      return {
        currentProject: {
          ...state.currentProject,
          notes: [...state.currentProject.notes, note],
        },
      };
    }),
  removeNote: (noteId) =>
    set((state) => {
      if (!state.currentProject) return state;
      return {
        currentProject: {
          ...state.currentProject,
          notes: state.currentProject.notes.filter((n) => n.id !== noteId),
        },
      };
    }),

  addTrack: (track) =>
    set((state) => {
      if (!state.currentProject) return state;
      return {
        currentProject: {
          ...state.currentProject,
          tracks: [...state.currentProject.tracks, track],
        },
      };
    }),
  updateTrack: (trackId, updates) =>
    set((state) => {
      if (!state.currentProject) return state;
      return {
        currentProject: {
          ...state.currentProject,
          tracks: state.currentProject.tracks.map((t) =>
            t.id === trackId ? { ...t, ...updates } : t
          ),
        },
      };
    }),
  removeTrack: (trackId) =>
    set((state) => {
      if (!state.currentProject) return state;
      return {
        currentProject: {
          ...state.currentProject,
          tracks: state.currentProject.tracks.filter((t) => t.id !== trackId),
          notes: state.currentProject.notes.filter((n) => n.trackId !== trackId),
        },
      };
    }),

  addToast: (message) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    set((state) => ({ toasts: [...state.toasts, { id, message }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 2000);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
