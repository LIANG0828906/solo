export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  expanded: boolean;
}

export interface Article {
  id: string;
  folderId: string;
  title: string;
  source: string;
  summary: string;
  iconUrl: string;
  note: string;
  tags: string[];
  rating: number;
  starred: boolean;
  createdAt: string;
}

export type SortMode = 'time-desc' | 'title-asc' | 'starred-first';
