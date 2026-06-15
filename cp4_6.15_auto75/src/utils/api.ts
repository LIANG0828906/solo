import type { LostItem, MatchResult } from '@/types';

const API_BASE = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `请求失败: ${response.status}`);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('网络错误，请稍后重试');
  }
}

export function fetchItems(filters?: {
  location?: string;
  dateFrom?: number;
  dateTo?: number;
}): Promise<LostItem[]> {
  const params = new URLSearchParams();

  if (filters?.location) {
    params.append('location', filters.location);
  }
  if (filters?.dateFrom !== undefined) {
    params.append('dateFrom', String(filters.dateFrom));
  }
  if (filters?.dateTo !== undefined) {
    params.append('dateTo', String(filters.dateTo));
  }

  const queryString = params.toString();
  const endpoint = queryString ? `/items?${queryString}` : '/items';

  return request<LostItem[]>(endpoint);
}

export function postItem(data: {
  title: string;
  location: string;
  description: string;
  image: string;
}): Promise<LostItem> {
  return request<LostItem>('/items', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function postClaim(id: string): Promise<LostItem> {
  return request<LostItem>(`/items/${id}/claim`, {
    method: 'POST',
  });
}

export function postMatch(description: string): Promise<MatchResult[]> {
  return request<MatchResult[]>('/match', {
    method: 'POST',
    body: JSON.stringify({ description }),
  });
}
