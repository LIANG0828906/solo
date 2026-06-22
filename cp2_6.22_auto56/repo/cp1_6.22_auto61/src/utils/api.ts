export interface BookmarkNode {
  id: string;
  type: 'folder' | 'bookmark';
  title: string;
  url?: string;
  parentId: string | null;
  children: BookmarkNode[];
  tags: string[];
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImportRequest {
  format: 'html' | 'json';
  data: string;
  targetFolderId?: string | null;
}

export interface ImportResponse {
  success: boolean;
  imported: number;
  duplicates: number;
  bookmarks: BookmarkNode[];
}

export interface SearchResult {
  id: string;
  title: string;
  url?: string;
  tags: string[];
  matches: {
    field: 'title' | 'url';
    indices: [number, number][];
  }[];
}

export interface ExportRequest {
  format: 'html' | 'json';
  scope: 'all' | 'folder';
  folderId?: string;
}

export interface ExportResponse {
  format: 'html' | 'json';
  filename: string;
  data: string;
}

const BASE_URL = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export function importBookmarks(req: ImportRequest): Promise<ImportResponse> {
  return request<ImportResponse>('/bookmarks/import', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

export function fetchBookmarks(): Promise<{ roots: BookmarkNode[] }> {
  return request<{ roots: BookmarkNode[] }>('/bookmarks');
}

export function updateBookmark(id: string, updates: Partial<BookmarkNode>): Promise<BookmarkNode> {
  return request<BookmarkNode>(`/bookmarks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export function deleteBookmark(id: string): Promise<void> {
  return request<void>(`/bookmarks/${id}`, {
    method: 'DELETE',
  });
}

export function searchBookmarks(q: string): Promise<SearchResult[]> {
  const params = new URLSearchParams({ q });
  return request<SearchResult[]>(`/bookmarks/search?${params.toString()}`);
}

export function exportBookmarks(req: ExportRequest): Promise<ExportResponse> {
  return request<ExportResponse>('/bookmarks/export', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}
