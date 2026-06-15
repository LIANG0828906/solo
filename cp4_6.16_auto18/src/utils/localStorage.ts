import { get, set, del, clear, keys } from 'idb-keyval';
import type { Album } from '../store/musicStore';

const ALBUMS_KEY = 'music_collection_albums';
const LIKES_KEY = 'music_collection_likes';

export const storage = {
  async getAlbums(): Promise<Album[]> {
    const albums = await get<Album[]>(ALBUMS_KEY);
    return albums || [];
  },

  async saveAlbums(albums: Album[]): Promise<void> {
    await set(ALBUMS_KEY, albums);
  },

  async getLikes(): Promise<Record<string, number>> {
    const likes = await get<Record<string, number>>(LIKES_KEY);
    return likes || {};
  },

  async saveLikes(likes: Record<string, number>): Promise<void> {
    await set(LIKES_KEY, likes);
  },

  async clearAll(): Promise<void> {
    await del(ALBUMS_KEY);
    await del(LIKES_KEY);
  },

  async getAllKeys(): Promise<string[]> {
    return await keys();
  }
};
