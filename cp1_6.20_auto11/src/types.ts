export interface Snippet {
  id: string;
  title: string;
  code: string;
  language: string;
  tags: string[];
  likes: number;
  favorites: number;
  isLiked: boolean;
  isFavorited: boolean;
  createdAt: string;
}

export interface CreateSnippetDto {
  title: string;
  code: string;
  language: string;
  tags: string[];
}
