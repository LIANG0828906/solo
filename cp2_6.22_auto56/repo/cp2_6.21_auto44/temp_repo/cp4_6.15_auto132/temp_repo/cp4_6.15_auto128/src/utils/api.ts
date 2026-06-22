import type { PublicCardData } from '../types';

const API_BASE = '/api';

async function request<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = (data as { error?: string }).error || `请求失败 (${response.status})`;
    throw new Error(error);
  }

  return data as T;
}

export async function fetchAllCards(): Promise<PublicCardData[]> {
  return request<PublicCardData[]>('/cards');
}

export async function fetchLeaderboard(): Promise<PublicCardData[]> {
  return request<PublicCardData[]>('/cards/leaderboard');
}

export async function fetchCard(id: string): Promise<PublicCardData> {
  return request<PublicCardData>(`/cards/${id}`);
}

export interface CreateCardData {
  title: string;
  description?: string;
  imageUrl?: string;
}

export async function createCard(data: CreateCardData): Promise<PublicCardData> {
  return request<PublicCardData>('/cards', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function rateCard(
  id: string,
  score: number
): Promise<{ success: boolean; averageRating: number; ratingCount: number }> {
  return request<{ success: boolean; averageRating: number; ratingCount: number }>(
    `/cards/${id}/rate`,
    {
      method: 'POST',
      body: JSON.stringify({ score }),
    }
  );
}

export async function addComment(
  id: string,
  content: string
): Promise<{ success: boolean; comment: PublicCardData['comments'][number]; commentCount: number }> {
  return request<{ success: boolean; comment: PublicCardData['comments'][number]; commentCount: number }>(
    `/cards/${id}/comments`,
    {
      method: 'POST',
      body: JSON.stringify({ content }),
    }
  );
}
