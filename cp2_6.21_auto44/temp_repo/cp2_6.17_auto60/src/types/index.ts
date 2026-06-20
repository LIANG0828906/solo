export interface Poem {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export type SortType = 'createdAt' | 'updatedAt' | 'title';
