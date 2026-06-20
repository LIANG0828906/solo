import type { Course, ReputationData, ReviewSubmission, UserReview, SearchResult } from '../types';

const API_BASE = '/api';

class LRUCache<K, V> {
  private cache: Map<K, { value: V; timestamp: number }>;
  private maxSize: number;
  private ttl: number;

  constructor(maxSize = 10, ttl = 60000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: K): V | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key: K, value: V): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, { value, timestamp: Date.now() });
  }
}

const searchCache = new LRUCache<string, Course[]>();

export const searchCourses = async (keyword: string): Promise<Course[]> => {
  const cached = searchCache.get(keyword);
  if (cached) {
    return cached;
  }

  const response = await fetch(
    `${API_BASE}/courses/search?keyword=${encodeURIComponent(keyword)}`
  );

  if (!response.ok) {
    throw new Error('搜索失败');
  }

  const data: SearchResult = await response.json();
  searchCache.set(keyword, data.courses);
  return data.courses;
};

export const submitReview = async (
  courseId: string,
  review: ReviewSubmission
): Promise<UserReview> => {
  const response = await fetch(`${API_BASE}/courses/${courseId}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(review),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '提交失败');
  }

  const data = await response.json();
  return data.review;
};

export const getReputation = async (courseId: string): Promise<ReputationData> => {
  const response = await fetch(`${API_BASE}/courses/${courseId}/reputation`);

  if (!response.ok) {
    throw new Error('获取口碑数据失败');
  }

  return response.json();
};
