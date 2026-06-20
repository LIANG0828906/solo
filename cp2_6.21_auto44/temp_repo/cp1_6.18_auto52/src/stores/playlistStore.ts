import { create } from 'zustand';
import type { Playlist } from '@/services/apiService';
import {
  getAllPlaylists as apiGetAll,
  createPlaylist as apiCreate,
  updatePlaylist as apiUpdate,
  deletePlaylist as apiDelete,
  addSongToPlaylist as apiAddSong,
  removeSongFromPlaylist as apiRemoveSong,
  generateShareLink as apiShareLink,
  recordShare as apiRecordShare,
} from '@/services/apiService';

interface PlaylistState {
  playlists: Playlist[];
  currentPlaylistId: string | null;
  loading: boolean;

  fetchPlaylists: () => Promise<void>;
  createPlaylist: (name: string, cover: string) => Promise<Playlist | null>;
  updatePlaylist: (id: string, data: Partial<Pick<Playlist, 'name' | 'cover'>>) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addSong: (playlistId: string, songId: string) => Promise<void>;
  removeSong: (playlistId: string, songId: string) => Promise<void>;
  setCurrentPlaylist: (id: string | null) => void;
  sharePlaylist: (id: string) => Promise<string>;
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  playlists: [],
  currentPlaylistId: null,
  loading: false,

  fetchPlaylists: async () => {
    set({ loading: true });
    const pls = await apiGetAll();
    set({ playlists: pls, loading: false });
  },

  createPlaylist: async (name, cover) => {
    const pl = await apiCreate(name, cover);
    if (pl) {
      set((s) => ({ playlists: [pl, ...s.playlists] }));
    }
    return pl;
  },

  updatePlaylist: async (id, data) => {
    const updated = await apiUpdate(id, data);
    if (updated) {
      set((s) => ({
        playlists: s.playlists.map((p) => (p.id === id ? updated : p)),
      }));
    }
  },

  deletePlaylist: async (id) => {
    await apiDelete(id);
    set((s) => ({
      playlists: s.playlists.filter((p) => p.id !== id),
      currentPlaylistId: s.currentPlaylistId === id ? null : s.currentPlaylistId,
    }));
  },

  addSong: async (playlistId, songId) => {
    const updated = await apiAddSong(playlistId, songId);
    if (updated) {
      set((s) => ({
        playlists: s.playlists.map((p) => (p.id === playlistId ? updated : p)),
      }));
    }
  },

  removeSong: async (playlistId, songId) => {
    const updated = await apiRemoveSong(playlistId, songId);
    if (updated) {
      set((s) => ({
        playlists: s.playlists.map((p) => (p.id === playlistId ? updated : p)),
      }));
    }
  },

  setCurrentPlaylist: (id) => set({ currentPlaylistId: id }),

  sharePlaylist: async (id) => {
    const url = await apiShareLink(id);
    await apiRecordShare(id);
    set((s) => ({
      playlists: s.playlists.map((p) =>
        p.id === id ? { ...p, shareCount: p.shareCount + 1 } : p
      ),
    }));
    return url;
  },
}));
