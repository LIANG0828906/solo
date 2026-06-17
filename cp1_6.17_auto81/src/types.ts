export interface Palette {
  id: string;
  name: string;
  colors: string[];
  author: string;
  votes: number;
  voterIds: string[];
  createdAt: number;
}

export interface Comment {
  id: string;
  paletteId: string;
  author: string;
  avatar: string;
  content: string;
  createdAt: number;
}

export type SortMode = 'latest' | 'popular';

export interface User {
  id: string;
  name: string;
  avatar: string;
}
