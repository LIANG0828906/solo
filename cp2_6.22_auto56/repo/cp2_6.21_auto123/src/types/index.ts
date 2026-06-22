export interface Snippet {
  id: string;
  title: string;
  language: 'javascript' | 'python' | 'html' | 'css' | 'typescript';
  code: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface SearchResult extends Snippet {
  matched_lines?: number[];
}

export interface SnippetCreate {
  title: string;
  language: 'javascript' | 'python' | 'html' | 'css' | 'typescript';
  code: string;
  tags: string[];
}

export interface SnippetUpdate {
  title?: string;
  language?: 'javascript' | 'python' | 'html' | 'css' | 'typescript';
  code?: string;
  tags?: string[];
}

export interface TagCount {
  tag: string;
  count: number;
}

export type SortBy = 'created_at' | 'updated_at';
export type SortOrder = 'asc' | 'desc';
export type LanguageFilter = 'all' | 'javascript' | 'python' | 'html' | 'css' | 'typescript';
