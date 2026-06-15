import axios from 'axios';

export interface LikeData {
  photoId: number;
  userId: string;
  liked: boolean;
  likeCount: number;
}

const STORAGE_KEY = 'leather_likes';
const LIKE_COUNT_KEY = 'leather_like_counts';

interface StoredLikes {
  [photoId: number]: {
    [userId: string]: boolean;
  };
}

interface StoredCounts {
  [photoId: number]: number;
}

export class LikeService {
  private getStoredLikes(): StoredLikes {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  }

  private setStoredLikes(likes: StoredLikes): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(likes));
  }

  private getStoredCounts(): StoredCounts {
    const data = localStorage.getItem(LIKE_COUNT_KEY);
    return data ? JSON.parse(data) : {};
  }

  private setStoredCounts(counts: StoredCounts): void {
    localStorage.setItem(LIKE_COUNT_KEY, JSON.stringify(counts));
  }

  async getLikeStatus(photoId: number, userId: string): Promise<LikeData> {
    try {
      const response = await axios.get<LikeData>(
        `/api/photos/${photoId}/like?userId=${encodeURIComponent(userId)}`
      );
      this.syncLocal(photoId, userId, response.data.liked, response.data.likeCount);
      return response.data;
    } catch {
      return this.getLocalLikeStatus(photoId, userId);
    }
  }

  async toggleLike(photoId: number, userId: string): Promise<LikeData> {
    try {
      const response = await axios.post<LikeData>(`/api/photos/${photoId}/like`, {
        userId,
      });
      this.syncLocal(photoId, userId, response.data.liked, response.data.likeCount);
      return response.data;
    } catch {
      return this.toggleLocalLike(photoId, userId);
    }
  }

  async getLikeCount(photoId: number): Promise<number> {
    try {
      const response = await axios.get<{ count: number }>(`/api/photos/${photoId}/likes`);
      const counts = this.getStoredCounts();
      counts[photoId] = response.data.count;
      this.setStoredCounts(counts);
      return response.data.count;
    } catch {
      return this.getStoredCounts()[photoId] || 0;
    }
  }

  private getLocalLikeStatus(photoId: number, userId: string): LikeData {
    const likes = this.getStoredLikes();
    const counts = this.getStoredCounts();
    const liked = likes[photoId]?.[userId] || false;
    const likeCount = counts[photoId] || 0;
    return { photoId, userId, liked, likeCount };
  }

  private toggleLocalLike(photoId: number, userId: string): LikeData {
    const likes = this.getStoredLikes();
    const counts = this.getStoredCounts();

    if (!likes[photoId]) {
      likes[photoId] = {};
    }

    const wasLiked = likes[photoId][userId] || false;
    likes[photoId][userId] = !wasLiked;

    if (!counts[photoId]) {
      counts[photoId] = 0;
    }
    counts[photoId] += !wasLiked ? 1 : -1;
    if (counts[photoId] < 0) counts[photoId] = 0;

    this.setStoredLikes(likes);
    this.setStoredCounts(counts);

    return {
      photoId,
      userId,
      liked: !wasLiked,
      likeCount: counts[photoId],
    };
  }

  private syncLocal(
    photoId: number,
    userId: string,
    liked: boolean,
    likeCount: number
  ): void {
    const likes = this.getStoredLikes();
    const counts = this.getStoredCounts();
    if (!likes[photoId]) likes[photoId] = {};
    likes[photoId][userId] = liked;
    counts[photoId] = likeCount;
    this.setStoredLikes(likes);
    this.setStoredCounts(counts);
  }

  initializeDefaultLikes(photoIds: number[]): void {
    const counts = this.getStoredCounts();
    let changed = false;
    photoIds.forEach((id) => {
      if (counts[id] === undefined) {
        counts[id] = Math.floor(Math.random() * 50) + 5;
        changed = true;
      }
    });
    if (changed) this.setStoredCounts(counts);
  }
}

export const likeService = new LikeService();
