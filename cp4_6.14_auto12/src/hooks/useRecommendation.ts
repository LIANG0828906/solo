import axios from 'axios';
import { useState, useEffect, useCallback } from 'react';

export interface Book {
  id: string;
  title: string;
  author: string;
  tags: string[];
  ownerId: string;
  ownerName: string;
  isExchanged: boolean;
  matchScore?: number;
}

export interface ExchangeRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  toUserId: string;
  offeredBookId: string;
  offeredBookTitle: string;
  requestedBookId: string;
  requestedBookTitle: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  preferences: string[];
  recentlyRead: string[];
  clickedTags: { [tag: string]: number };
  books: Book[];
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  createdAt: number;
  read: boolean;
}

interface UseRecommendationResult {
  recommendations: Book[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useRecommendation(userPreferences: string[], recentlyRead: string[]): UseRecommendationResult {
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 200));
      const response = await axios.get<{ recommendations: Book[] }>('/api/recommendations');
      setRecommendations(response.data.recommendations);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取推荐失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations, userPreferences.length, recentlyRead.length]);

  return { recommendations, loading, error, refresh: fetchRecommendations };
}
