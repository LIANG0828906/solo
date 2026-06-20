import { create } from 'zustand';
import axios from 'axios';
import { StyleFeatures } from '@/utils/audioAnalysis';

export interface Marker {
  id: string;
  lat: number;
  lng: number;
  name: string;
  note: string;
  audioUrl: string;
  styleFeatures: StyleFeatures;
  isPublic: boolean;
  isFavorited: boolean;
  creatorId: string;
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
}

interface MarkerState {
  markers: Marker[];
  activeMarkerId: string | null;
  playingMarkerId: string | null;
  recentPlayedStyles: StyleFeatures[];
  userName: string | null;
  userId: string | null;
  favorites: string[];
  isCreatingMode: boolean;
  pendingLatLng: { lat: number; lng: number } | null;

  loadMarkers: () => Promise<void>;
  addMarker: (marker: Omit<Marker, 'id' | 'createdAt'>) => Promise<Marker | null>;
  updateMarker: (id: string, updates: Partial<Marker>) => void;
  deleteMarker: (id: string) => Promise<boolean>;
  togglePublic: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setActiveMarker: (id: string | null) => void;
  setPlayingMarker: (id: string | null) => void;
  addRecentStyle: (style: StyleFeatures) => void;
  login: (name: string) => void;
  logout: () => void;
  setCreatingMode: (mode: boolean) => void;
  setPendingLatLng: (latLng: { lat: number; lng: number } | null) => void;
}

const LS_USERS = 'voicemap_users';
const LS_CURRENT_USER = 'voicemap_currentUser';
const LS_FAVORITES = 'voicemap_favorites';
const LS_MARKERS_LOCAL = 'voicemap_markers_local';

const persistToLS = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

const loadFromLS = <T,>(key: string, def: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return def;
    return JSON.parse(raw) as T;
  } catch {
    return def;
  }
};

const loadPersistedUser = () => {
  const saved = localStorage.getItem(LS_CURRENT_USER);
  if (saved) {
    try {
      return JSON.parse(saved) as User;
    } catch {}
  }
  return null;
};

const persistedUser = loadPersistedUser();

export const useMarkerStore = create<MarkerState>((set, get) => ({
  markers: [],
  activeMarkerId: null,
  playingMarkerId: null,
  recentPlayedStyles: [],
  userName: persistedUser?.name || null,
  userId: persistedUser?.id || null,
  favorites: loadFromLS<string[]>(LS_FAVORITES, []),
  isCreatingMode: false,
  pendingLatLng: null,

  loadMarkers: async () => {
    try {
      const res = await axios.get('/api/markers');
      if (res.data.success) {
        const serverMarkers = res.data.data as Marker[];
        const localMarkers = loadFromLS<Marker[]>(LS_MARKERS_LOCAL, []);
        const userId = get().userId;
        const myPrivateMarkers = localMarkers.filter(m => m.creatorId === userId && !m.isPublic);
        const favorites = get().favorites;
        const all = [...serverMarkers, ...myPrivateMarkers].map(m => ({
          ...m,
          isFavorited: favorites.includes(m.id),
        }));
        set({ markers: all });
      }
    } catch {
      const localMarkers = loadFromLS<Marker[]>(LS_MARKERS_LOCAL, []);
      set({ markers: localMarkers });
    }
  },

  addMarker: async (markerData) => {
    try {
      const res = await axios.post('/api/markers', markerData);
      if (res.data.success) {
        const newMarker = res.data.data as Marker;
        const local = loadFromLS<Marker[]>(LS_MARKERS_LOCAL, []);
        local.push(newMarker);
        persistToLS(LS_MARKERS_LOCAL, local);
        set((state) => ({ markers: [...state.markers, newMarker] }));
        return newMarker;
      }
    } catch {}
    const fallback: Marker = {
      ...markerData,
      id: 'local_' + Date.now(),
      createdAt: Date.now(),
    };
    const local = loadFromLS<Marker[]>(LS_MARKERS_LOCAL, []);
    local.push(fallback);
    persistToLS(LS_MARKERS_LOCAL, local);
    set((state) => ({ markers: [...state.markers, fallback] }));
    return fallback;
  },

  updateMarker: (id, updates) => {
    set((state) => {
      const markers = state.markers.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      );
      const local = loadFromLS<Marker[]>(LS_MARKERS_LOCAL, []);
      const idx = local.findIndex(m => m.id === id);
      if (idx >= 0) {
        local[idx] = { ...local[idx], ...updates };
        persistToLS(LS_MARKERS_LOCAL, local);
      }
      return { markers };
    });
  },

  deleteMarker: async (id) => {
    try {
      const res = await axios.delete(`/api/markers/${id}`);
      if (res.data.success) {
        set((state) => ({
          markers: state.markers.filter((m) => m.id !== id),
          activeMarkerId: state.activeMarkerId === id ? null : state.activeMarkerId,
          playingMarkerId: state.playingMarkerId === id ? null : state.playingMarkerId,
        }));
        const local = loadFromLS<Marker[]>(LS_MARKERS_LOCAL, []);
        persistToLS(LS_MARKERS_LOCAL, local.filter(m => m.id !== id));
        return true;
      }
    } catch {}
    set((state) => ({
      markers: state.markers.filter((m) => m.id !== id),
      activeMarkerId: state.activeMarkerId === id ? null : state.activeMarkerId,
      playingMarkerId: state.playingMarkerId === id ? null : state.playingMarkerId,
    }));
    const local = loadFromLS<Marker[]>(LS_MARKERS_LOCAL, []);
    persistToLS(LS_MARKERS_LOCAL, local.filter(m => m.id !== id));
    return true;
  },

  togglePublic: (id) => {
    const marker = get().markers.find((m) => m.id === id);
    if (marker) {
      get().updateMarker(id, { isPublic: !marker.isPublic });
    }
  },

  toggleFavorite: (id) => {
    set((state) => {
      const favorites = state.favorites.includes(id)
        ? state.favorites.filter((f) => f !== id)
        : [...state.favorites, id];
      persistToLS(LS_FAVORITES, favorites);
      const markers = state.markers.map((m) =>
        m.id === id ? { ...m, isFavorited: !m.isFavorited } : m
      );
      return { favorites, markers };
    });
  },

  setActiveMarker: (id) => set({ activeMarkerId: id }),
  setPlayingMarker: (id) => set({ playingMarkerId: id }),

  addRecentStyle: (style) => {
    set((state) => {
      const recent = [style, ...state.recentPlayedStyles].slice(0, 5);
      return { recentPlayedStyles: recent };
    });
  },

  login: (name) => {
    const id = 'user_' + Date.now();
    const user = { id, name };
    const users = loadFromLS<Record<string, User>>(LS_USERS, {});
    users[id] = user;
    persistToLS(LS_USERS, users);
    localStorage.setItem(LS_CURRENT_USER, JSON.stringify(user));
    set({ userName: name, userId: id });
  },

  logout: () => {
    localStorage.removeItem(LS_CURRENT_USER);
    set({ userName: null, userId: null });
  },

  setCreatingMode: (mode) => set({ isCreatingMode: mode, pendingLatLng: null }),
  setPendingLatLng: (latLng) => set({ pendingLatLng: latLng }),
}));
