export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  level: number;
  isExpanded: boolean;
}

export interface Snippet {
  id: string;
  title: string;
  content: string;
  tags: string[];
  categoryId: string | null;
  createdAt: number;
  updatedAt: number;
}

export type SortOrder = 'createdAt' | 'updatedAt' | 'alphabetical';
