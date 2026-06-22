export interface Source {
  id: string;
  name: string;
  type: 'rss' | 'youtube' | 'podcast';
  url: string;
  unreadCount: number;
}

export interface Article {
  id: string;
  sourceId: string;
  title: string;
  summary: string;
  publishTime: number;
  isRead: boolean;
}

const API_BASE = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `请求失败: ${response.status}`);
  }

  return response.json();
}

export function getSources(): Promise<Source[]> {
  return request<Source[]>('/sources');
}

export function addSource(data: { name: string; type: string; url: string }): Promise<Source> {
  return request<Source>('/sources', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getArticles(sourceId: string): Promise<Article[]> {
  return request<Article[]>(`/sources/${sourceId}/articles`);
}

export function markArticleRead(articleId: string, isRead: boolean): Promise<Article> {
  return request<Article>(`/articles/${articleId}`, {
    method: 'PATCH',
    body: JSON.stringify({ isRead }),
  });
}
