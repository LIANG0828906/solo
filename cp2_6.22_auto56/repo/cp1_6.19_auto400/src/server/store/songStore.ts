import { Song, User } from '../types';

const MAX_SONGS = 10;

export const songs = new Map<string, Song>();
export const connections = new Map<string, Map<string, { ws: any; user: User }>>();

export function getSongs(): Song[] {
  return Array.from(songs.values());
}

export function getSong(id: string): Song | undefined {
  return songs.get(id);
}

export function addSong(song: Song): boolean {
  if (songs.size >= MAX_SONGS) {
    return false;
  }
  songs.set(song.id, song);
  return true;
}

export function updateSong(id: string, updates: Partial<Song>): Song | undefined {
  const song = songs.get(id);
  if (!song) return undefined;
  
  const updated = { ...song, ...updates, updatedAt: Date.now() };
  songs.set(id, updated);
  return updated;
}

export function deleteSong(id: string): boolean {
  return songs.delete(id);
}

export function addConnection(songId: string, userId: string, ws: any, user: User): boolean {
  if (!connections.has(songId)) {
    connections.set(songId, new Map());
  }
  
  const songConnections = connections.get(songId)!;
  if (songConnections.size >= 4 && !songConnections.has(userId)) {
    return false;
  }
  
  songConnections.set(userId, { ws, user });
  return true;
}

export function removeConnection(songId: string, userId: string): void {
  const songConnections = connections.get(songId);
  if (songConnections) {
    songConnections.delete(userId);
    if (songConnections.size === 0) {
      connections.delete(songId);
    }
  }
}

export function getConnections(songId: string): Map<string, { ws: any; user: User }> {
  return connections.get(songId) || new Map();
}

export function getConnectedUsers(songId: string): User[] {
  const songConnections = connections.get(songId);
  if (!songConnections) return [];
  return Array.from(songConnections.values()).map(c => c.user);
}
