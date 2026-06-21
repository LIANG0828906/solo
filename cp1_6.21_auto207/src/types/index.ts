export type ContentType = 'text' | 'image' | 'mixed';

export interface SelectionData {
  x: number;
  y: number;
  width: number;
  height: number;
  contentType: ContentType;
  html: string;
  plainText: string;
}

export interface Snippet {
  id: string;
  title: string;
  tags: string[];
  sourceUrl: string;
  contentType: ContentType;
  html: string;
  plainText: string;
  createdAt: number;
}

export interface CreateSnippetRequest {
  title: string;
  tags: string[];
  sourceUrl: string;
  contentType: ContentType;
  html: string;
  plainText: string;
}

export interface SnippetQuery {
  search?: string;
  tags?: string[];
  sort?: 'createdAt_desc' | 'createdAt_asc' | 'title_asc';
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
