import { get, set, del, keys } from 'idb-keyval';
import type { Album } from '../store/musicStore';

const ALBUMS_KEY = 'music_collection_albums';
const LIKES_KEY = 'music_collection_likes';
const LIKE_TIMES_KEY = 'music_collection_like_times';

export interface LikeRecord {
  albumId: string;
  timestamp: string;
}

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

  async getLikeTimes(): Promise<LikeRecord[]> {
    const likeTimes = await get<LikeRecord[]>(LIKE_TIMES_KEY);
    return likeTimes || [];
  },

  async saveLikeTimes(likeTimes: LikeRecord[]): Promise<void> {
    await set(LIKE_TIMES_KEY, likeTimes);
  },

  async addLikeTime(albumId: string): Promise<void> {
    const likeTimes = await this.getLikeTimes();
    likeTimes.push({ albumId, timestamp: new Date().toISOString() });
    await this.saveLikeTimes(likeTimes);
  },

  async clearAll(): Promise<void> {
    await del(ALBUMS_KEY);
    await del(LIKES_KEY);
    await del(LIKE_TIMES_KEY);
  },

  async getAllKeys(): Promise<string[]> {
    return await keys();
  }
};
