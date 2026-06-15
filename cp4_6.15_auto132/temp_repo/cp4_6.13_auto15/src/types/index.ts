export interface BookMark {
  id: string;
  title: string;
  author: string;
  excerpt: string;
  note?: string;
  rating: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookmarkDto {
  title: string;
  author: string;
  excerpt: string;
  note?: string;
  rating: number;
  tags: string[];
}

export type UpdateBookmarkDto = Partial<CreateBookmarkDto>;
