import { create } from 'zustand';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import type { Playlist, Song, Comment, SortType, PlaylistSummary } from '../types';

const COMMENTS_PAGE_SIZE = 20;

interface PlaylistState {
  playlists: Playlist[];
  currentPlaylist: Playlist | null;
  currentSongs: Song[];
  currentComments: Comment[];
  totalCommentCount: number;
  displayedCommentCount: number;
  isLoading: boolean;

  loadPlaylists: () => Promise<void>;
  loadPlaylist: (id: string) => Promise<void>;
  loadSongs: (playlistId: string) => Promise<void>;
  loadComments: (playlistId: string, limit?: number) => Promise<void>;
  loadMoreComments: (playlistId: string) => Promise<void>;

  createPlaylist: (data: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt' | 'creator' | 'songCount' | 'commentCount'>) => Promise<string>;
  updatePlaylist: (id: string, data: Partial<Playlist>) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;

  addSong: (playlistId: string, song: Omit<Song, 'id' | 'playlistId' | 'order'>) => Promise<void>;
  removeSong: (songId: string) => Promise<void>;
  reorderSongs: (playlistId: string, songs: Song[]) => Promise<void>;
  updateSong: (songId: string, data: Partial<Song>) => Promise<void>;

  addComment: (playlistId: string, nickname: string, content: string) => Promise<void>;

  getFilteredPlaylistSummaries: (sortBy: SortType, searchQuery?: string) => PlaylistSummary[];
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  playlists: [],
  currentPlaylist: null,
  currentSongs: [],
  currentComments: [],
  totalCommentCount: 0,
  displayedCommentCount: 0,
  isLoading: false,

  loadPlaylists: async () => {
    set({ isLoading: true });
    try {
      const playlists = await idbGet<Playlist[]>('playlists') || [];
      set({ playlists });
    } catch (error) {
      console.error('Failed to load playlists:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  loadPlaylist: async (id: string) => {
    set({ isLoading: true });
    try {
      const playlists = await idbGet<Playlist[]>('playlists') || [];
      const playlist = playlists.find(p => p.id === id) || null;
      set({ currentPlaylist: playlist });
    } catch (error) {
      console.error('Failed to load playlist:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  loadSongs: async (playlistId: string) => {
    try {
      const songs = await idbGet<Song[]>(`songs:${playlistId}`) || [];
      const sortedSongs = [...songs].sort((a, b) => a.order - b.order);
      set({ currentSongs: sortedSongs });
    } catch (error) {
      console.error('Failed to load songs:', error);
    }
  },

  loadComments: async (playlistId: string, limit: number = COMMENTS_PAGE_SIZE) => {
    try {
      const comments = await idbGet<Comment[]>(`comments:${playlistId}`) || [];
      const sortedComments = [...comments].sort((a, b) => a.createdAt - b.createdAt);
      const displayed = sortedComments.slice(0, limit);
      set({
        currentComments: displayed,
        totalCommentCount: sortedComments.length,
        displayedCommentCount: displayed.length,
      });
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  },

  loadMoreComments: async (playlistId: string) => {
    try {
      const { displayedCommentCount } = get();
      const nextLimit = displayedCommentCount + COMMENTS_PAGE_SIZE;
      const comments = await idbGet<Comment[]>(`comments:${playlistId}`) || [];
      const sortedComments = [...comments].sort((a, b) => a.createdAt - b.createdAt);
      const displayed = sortedComments.slice(0, nextLimit);
      set({
        currentComments: displayed,
        totalCommentCount: sortedComments.length,
        displayedCommentCount: displayed.length,
      });
    } catch (error) {
      console.error('Failed to load more comments:', error);
    }
  },

  createPlaylist: async (data) => {
    const now = Date.now();
    const newPlaylist: Playlist = {
      ...data,
      id: uuidv4(),
      creator: '音乐爱好者',
      songCount: 0,
      commentCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const playlists = await idbGet<Playlist[]>('playlists') || [];
    const updatedPlaylists = [newPlaylist, ...playlists];
    await idbSet('playlists', updatedPlaylists);
    await idbSet(`songs:${newPlaylist.id}`, []);
    await idbSet(`comments:${newPlaylist.id}`, []);

    set({ playlists: updatedPlaylists, currentPlaylist: newPlaylist, currentSongs: [], currentComments: [], totalCommentCount: 0, displayedCommentCount: 0 });
    return newPlaylist.id;
  },

  updatePlaylist: async (id, data) => {
    const playlists = await idbGet<Playlist[]>('playlists') || [];
    const updatedPlaylists = playlists.map(p =>
      p.id === id ? { ...p, ...data, updatedAt: Date.now() } : p
    );
    await idbSet('playlists', updatedPlaylists);

    const currentPlaylist = get().currentPlaylist;
    if (currentPlaylist && currentPlaylist.id === id) {
      set({
        currentPlaylist: { ...currentPlaylist, ...data, updatedAt: Date.now() },
      });
    }
    set({ playlists: updatedPlaylists });
  },

  deletePlaylist: async (id) => {
    const playlists = await idbGet<Playlist[]>('playlists') || [];
    const updatedPlaylists = playlists.filter(p => p.id !== id);
    await idbSet('playlists', updatedPlaylists);
    await idbSet(`songs:${id}`, undefined);
    await idbSet(`comments:${id}`, undefined);

    set({ playlists: updatedPlaylists });
    const currentPlaylist = get().currentPlaylist;
    if (currentPlaylist && currentPlaylist.id === id) {
      set({ currentPlaylist: null, currentSongs: [], currentComments: [], totalCommentCount: 0, displayedCommentCount: 0 });
    }
  },

  addSong: async (playlistId, song) => {
    const songs = await idbGet<Song[]>(`songs:${playlistId}`) || [];
    const newSong: Song = {
      ...song,
      id: uuidv4(),
      playlistId,
      order: songs.length,
    };
    const updatedSongs = [...songs, newSong];
    await idbSet(`songs:${playlistId}`, updatedSongs);

    const sortedSongs = [...updatedSongs].sort((a, b) => a.order - b.order);
    set({ currentSongs: sortedSongs });

    const playlists = await idbGet<Playlist[]>('playlists') || [];
    const updatedPlaylists = playlists.map(p =>
      p.id === playlistId ? { ...p, songCount: p.songCount + 1, updatedAt: Date.now() } : p
    );
    await idbSet('playlists', updatedPlaylists);
    set({ playlists: updatedPlaylists });

    const currentPlaylist = get().currentPlaylist;
    if (currentPlaylist && currentPlaylist.id === playlistId) {
      set({
        currentPlaylist: { ...currentPlaylist, songCount: currentPlaylist.songCount + 1, updatedAt: Date.now() },
      });
    }
  },

  removeSong: async (songId) => {
    const currentSongs = get().currentSongs;
    const song = currentSongs.find(s => s.id === songId);
    if (!song) return;

    const songs = await idbGet<Song[]>(`songs:${song.playlistId}`) || [];
    const updatedSongs = songs.filter(s => s.id !== songId);
    const reorderedSongs = updatedSongs.map((s, i) => ({ ...s, order: i }));
    await idbSet(`songs:${song.playlistId}`, reorderedSongs);

    const sortedSongs = [...reorderedSongs].sort((a, b) => a.order - b.order);
    set({ currentSongs: sortedSongs });

    const playlists = await idbGet<Playlist[]>('playlists') || [];
    const updatedPlaylists = playlists.map(p =>
      p.id === song.playlistId ? { ...p, songCount: Math.max(0, p.songCount - 1), updatedAt: Date.now() } : p
    );
    await idbSet('playlists', updatedPlaylists);
    set({ playlists: updatedPlaylists });

    const currentPlaylist = get().currentPlaylist;
    if (currentPlaylist && currentPlaylist.id === song.playlistId) {
      set({
        currentPlaylist: { ...currentPlaylist, songCount: Math.max(0, currentPlaylist.songCount - 1), updatedAt: Date.now() },
      });
    }
  },

  reorderSongs: async (playlistId, songs) => {
    const reorderedSongs = songs.map((song, index) => ({ ...song, order: index }));
    await idbSet(`songs:${playlistId}`, reorderedSongs);
    set({ currentSongs: reorderedSongs });

    const playlists = await idbGet<Playlist[]>('playlists') || [];
    const updatedPlaylists = playlists.map(p =>
      p.id === playlistId ? { ...p, updatedAt: Date.now() } : p
    );
    await idbSet('playlists', updatedPlaylists);
    set({ playlists: updatedPlaylists });
  },

  updateSong: async (songId, data) => {
    const currentSongs = get().currentSongs;
    const song = currentSongs.find(s => s.id === songId);
    if (!song) return;

    const songs = await idbGet<Song[]>(`songs:${song.playlistId}`) || [];
    const updatedSongs = songs.map(s =>
      s.id === songId ? { ...s, ...data } : s
    );
    await idbSet(`songs:${song.playlistId}`, updatedSongs);

    const sortedSongs = [...updatedSongs].sort((a, b) => a.order - b.order);
    set({ currentSongs: sortedSongs });
  },

  addComment: async (playlistId, nickname, content) => {
    const comments = await idbGet<Comment[]>(`comments:${playlistId}`) || [];
    const newComment: Comment = {
      id: uuidv4(),
      playlistId,
      nickname,
      content,
      createdAt: Date.now(),
    };
    const updatedComments = [...comments, newComment];
    const sortedComments = [...updatedComments].sort((a, b) => a.createdAt - b.createdAt);
    await idbSet(`comments:${playlistId}`, updatedComments);

    const { displayedCommentCount } = get();
    const displayed = sortedComments.slice(0, Math.max(displayedCommentCount + 1, COMMENTS_PAGE_SIZE));
    set({
      currentComments: displayed,
      totalCommentCount: sortedComments.length,
      displayedCommentCount: displayed.length,
    });

    const playlists = await idbGet<Playlist[]>('playlists') || [];
    const updatedPlaylists = playlists.map(p =>
      p.id === playlistId ? { ...p, commentCount: p.commentCount + 1, updatedAt: Date.now() } : p
    );
    await idbSet('playlists', updatedPlaylists);
    set({ playlists: updatedPlaylists });

    const currentPlaylist = get().currentPlaylist;
    if (currentPlaylist && currentPlaylist.id === playlistId) {
      set({
        currentPlaylist: { ...currentPlaylist, commentCount: currentPlaylist.commentCount + 1, updatedAt: Date.now() },
      });
    }
  },

  getFilteredPlaylistSummaries: (sortBy, searchQuery = '') => {
    const { playlists } = get();

    let filtered = playlists;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = playlists.filter(
        p => p.title.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
      );
    }

    const summaries: PlaylistSummary[] = filtered.map(p => ({
      id: p.id,
      title: p.title,
      coverColor: p.coverColor,
      description: p.description,
      creator: p.creator,
      songCount: p.songCount,
      commentCount: p.commentCount,
      updatedAt: p.updatedAt,
    }));

    if (sortBy === 'createdAt') {
      summaries.sort((a, b) => b.updatedAt - a.updatedAt);
    } else if (sortBy === 'songCount') {
      summaries.sort((a, b) => b.songCount - a.songCount);
    }

    return summaries;
  },
}));
