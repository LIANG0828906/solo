import type { Song, Playlist } from '@/types';
import { mockSongs, mockPlaylists } from './mockData';
import { generateId, generateRandomColor } from './helpers';

const SONGS_STORAGE_KEY = 'auto13_songs';
const PLAYLISTS_STORAGE_KEY = 'auto13_playlists';

function delay<T>(data: T, ms: number = 300): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), ms);
  });
}

export function saveToLocalStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

export function loadFromLocalStorage<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return null;
  }
}

function getSongs(): Song[] {
  const stored = loadFromLocalStorage<Song[]>(SONGS_STORAGE_KEY);
  if (stored && stored.length > 0) {
    return stored;
  }
  saveToLocalStorage(SONGS_STORAGE_KEY, mockSongs);
  return mockSongs;
}

function getPlaylists(): Playlist[] {
  const stored = loadFromLocalStorage<Playlist[]>(PLAYLISTS_STORAGE_KEY);
  if (stored && stored.length > 0) {
    return stored;
  }
  saveToLocalStorage(PLAYLISTS_STORAGE_KEY, mockPlaylists);
  return mockPlaylists;
}

export async function getSongsApi(): Promise<Song[]> {
  return delay(getSongs(), 200);
}

export async function getAllSongs(): Promise<Song[]> {
  return getSongsApi();
}

export async function searchSongsApi(keyword: string): Promise<Song[]> {
  if (!keyword?.trim()) {
    return delay(getSongs(), 200);
  }
  
  const lowerKeyword = keyword.toLowerCase().trim();
  const songs = getSongs();
  const filtered = songs.filter(
    (song) =>
      song.title.toLowerCase().includes(lowerKeyword) ||
      song.artist.toLowerCase().includes(lowerKeyword) ||
      song.album.toLowerCase().includes(lowerKeyword)
  );
  
  return delay(filtered, 300);
}

export async function searchSongs(keyword: string): Promise<Song[]> {
  return searchSongsApi(keyword);
}

export async function getPlaylistsApi(): Promise<Playlist[]> {
  return delay(getPlaylists(), 200);
}

export async function getAllPlaylists(): Promise<Playlist[]> {
  return getPlaylistsApi();
}

export async function getPlaylist(id: string): Promise<Playlist | null> {
  const playlists = getPlaylists();
  const playlist = playlists.find((p) => p.id === id) || null;
  return delay(playlist, 150);
}

export async function createPlaylistApi(name: string, description: string): Promise<Playlist> {
  const playlists = getPlaylists();
  
  const newPlaylist: Playlist = {
    id: generateId(),
    name,
    description,
    cover: `https://picsum.photos/seed/${encodeURIComponent(name)}/300/300`,
    color: generateRandomColor(),
    songIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    shared: false,
  };
  
  const updatedPlaylists = [newPlaylist, ...playlists];
  saveToLocalStorage(PLAYLISTS_STORAGE_KEY, updatedPlaylists);
  
  return delay(newPlaylist, 300);
}

export async function savePlaylist(playlist: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt' | 'color' | 'cover'>): Promise<Playlist> {
  return createPlaylistApi(playlist.name, playlist.description);
}

export async function updatePlaylist(id: string, updates: Partial<Omit<Playlist, 'id' | 'createdAt'>>): Promise<Playlist | null> {
  const playlists = getPlaylists();
  const index = playlists.findIndex((p) => p.id === id);
  
  if (index === -1) {
    return delay(null, 150);
  }
  
  const updatedPlaylist: Playlist = {
    ...playlists[index],
    ...updates,
    updatedAt: Date.now(),
  };
  
  const updatedPlaylists = [...playlists];
  updatedPlaylists[index] = updatedPlaylist;
  saveToLocalStorage(PLAYLISTS_STORAGE_KEY, updatedPlaylists);
  
  return delay(updatedPlaylist, 250);
}

export async function deletePlaylist(id: string): Promise<boolean> {
  const playlists = getPlaylists();
  const filtered = playlists.filter((p) => p.id !== id);
  
  if (filtered.length === playlists.length) {
    return delay(false, 150);
  }
  
  saveToLocalStorage(PLAYLISTS_STORAGE_KEY, filtered);
  return delay(true, 200);
}

export async function addSongToPlaylistApi(playlistId: string, songId: string): Promise<boolean> {
  const playlists = getPlaylists();
  const playlist = playlists.find((p) => p.id === playlistId);
  
  if (!playlist || playlist.songIds.includes(songId)) {
    return delay(false, 150);
  }
  
  await updatePlaylist(playlistId, {
    songIds: [...playlist.songIds, songId],
  });
  
  return delay(true, 200);
}

export async function addSongToPlaylist(playlistId: string, songId: string): Promise<Playlist | null> {
  const playlists = getPlaylists();
  const playlist = playlists.find((p) => p.id === playlistId);
  
  if (!playlist) {
    return delay(null, 150);
  }
  
  if (playlist.songIds.includes(songId)) {
    return delay(playlist, 100);
  }
  
  return updatePlaylist(playlistId, {
    songIds: [...playlist.songIds, songId],
  });
}

export async function removeSongFromPlaylistApi(playlistId: string, songId: string): Promise<boolean> {
  const playlists = getPlaylists();
  const playlist = playlists.find((p) => p.id === playlistId);
  
  if (!playlist || !playlist.songIds.includes(songId)) {
    return delay(false, 150);
  }
  
  await updatePlaylist(playlistId, {
    songIds: playlist.songIds.filter((id) => id !== songId),
  });
  
  return delay(true, 200);
}

export async function removeSongFromPlaylist(playlistId: string, songId: string): Promise<Playlist | null> {
  const playlists = getPlaylists();
  const playlist = playlists.find((p) => p.id === playlistId);
  
  if (!playlist) {
    return delay(null, 150);
  }
  
  return updatePlaylist(playlistId, {
    songIds: playlist.songIds.filter((id) => id !== songId),
  });
}
