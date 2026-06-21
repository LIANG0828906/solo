export type MaterialType = 'text' | 'link' | 'image';

export interface Material {
  id: string;
  title: string;
  content: string;
  type: MaterialType;
  imageUrl?: string;
  createdAt: string;
}

export interface Draft {
  id: string;
  content: string;
  updatedAt: string;
}
