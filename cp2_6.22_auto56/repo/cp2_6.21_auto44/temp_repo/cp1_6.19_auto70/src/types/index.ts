export type BookCategory = '文学' | '科技' | '历史' | '哲学' | '心理';

export interface Excerpt {
  id: string;
  bookTitle: string;
  author: string;
  content: string;
  annotation: string;
  category: BookCategory;
  tags: string[];
  images: string[];
  color: string;
  createdAt: number;
  updatedAt: number;
}

export interface LinkedExcerpt {
  excerpt: Excerpt;
  similarity: number;
}

export interface TagFrequency {
  tag: string;
  count: number;
}

export type SortOption = 'newest' | 'oldest' | 'title';
