import type { LostItem, MatchResult } from '@/types';

const API_BASE = '/api';

type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: string;
};

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

    const data = await response.json().catch(() => ({ success: false, error: '响应解析失败' }));

    if (!response.ok) {
      throw new Error((data as ApiResponse<T>).error || `请求失败: ${response.status}`);
    }

    const resp = data as ApiResponse<T>;
    if (!resp.success) {
      throw new Error(resp.error || '请求失败');
    }

    return resp.data;
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
  return request<LostItem>(`/items/${id}`, {
    method: 'DELETE',
  });
}

export function postMatch(description: string): Promise<MatchResult[]> {
  return request<MatchResult[]>('/matches', {
    method: 'POST',
    body: JSON.stringify({ description }),
  });
}
