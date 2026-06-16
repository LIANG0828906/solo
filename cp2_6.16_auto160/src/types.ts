export interface Exhibit {
  id: string;
  title: string;
  description: string;
  tags: string[];
  imageUrl: string;
  createdAt: number;
}

export type ViewMode = 'grid' | 'list';
