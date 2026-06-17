import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Point {
  x: number;
  y: number;
  timestamp: number;
  speed: number;
}

export interface Tag {
  id: string;
  text: string;
  pointIndex: number;
  x: number;
  y: number;
}

export interface Route {
  id: string;
  name: string;
  date: string;
  points: Point[];
  tags: Tag[];
}

interface AppState {
  routes: Route[];
  currentRoute: Route | null;
  isRecording: boolean;
  isPlaying: boolean;
  currentTime: number;
  recordedPoints: Point[];
  tags: Tag[];
  fetchRoutes: () => Promise<void>;
  selectRoute: (route: Route | null) => void;
  startRecording: () => void;
  stopRecording: (name: string) => Promise<void>;
  addPoint: (point: Point) => void;
  startPlayback: () => void;
  stopPlayback: () => void;
  setCurrentTime: (time: number) => void;
  addTag: (tag: Omit<Tag, 'id'>) => void;
  updateTagPosition: (tagId: string, x: number, y: number) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  routes: [],
  currentRoute: null,
  isRecording: false,
  isPlaying: false,
  currentTime: 0,
  recordedPoints: [],
  tags: [],

  fetchRoutes: async () => {
    try {
      const response = await fetch('/api/routes');
      const routes: Route[] = await response.json();
      set({ routes });
    } catch (error) {
      console.error('Failed to fetch routes:', error);
    }
  },

  selectRoute: (route: Route | null) => {
    set({
      currentRoute: route,
      tags: route ? route.tags : [],
      currentTime: 0,
      isPlaying: false,
    });
  },

  startRecording: () => {
    set({
      isRecording: true,
      recordedPoints: [],
      tags: [],
      isPlaying: false,
      currentTime: 0,
    });
  },

  stopRecording: async (name: string) => {
    const { recordedPoints, tags } = get();
    const newRoute: Route = {
      id: uuidv4(),
      name,
      date: new Date().toISOString(),
      points: recordedPoints,
      tags,
    };

    try {
      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRoute),
      });
      const savedRoute: Route = await response.json();
      set((state) => ({
        routes: [...state.routes, savedRoute],
        isRecording: false,
        currentRoute: savedRoute,
        recordedPoints: [],
      }));
    } catch (error) {
      console.error('Failed to save route:', error);
      set({ isRecording: false });
    }
  },

  addPoint: (point: Point) => {
    set((state) => ({
      recordedPoints: [...state.recordedPoints, point],
    }));
  },

  startPlayback: () => {
    set({ isPlaying: true });
  },

  stopPlayback: () => {
    set({ isPlaying: false });
  },

  setCurrentTime: (time: number) => {
    set({ currentTime: time });
  },

  addTag: (tag: Omit<Tag, 'id'>) => {
    const newTag: Tag = {
      ...tag,
      id: uuidv4(),
    };
    set((state) => ({
      tags: [...state.tags, newTag],
    }));
  },

  updateTagPosition: (tagId: string, x: number, y: number) => {
    set((state) => ({
      tags: state.tags.map((tag) =>
        tag.id === tagId ? { ...tag, x, y } : tag
      ),
    }));
  },
}));
