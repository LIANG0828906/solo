export interface Letter {
  id: number;
  title: string;
  content: string;
  font: string;
  isPublic: boolean;
  tags: string;
  createdAt: string;
  favoritesCount: number;
}

export interface Favorite {
  id: number;
  letterId: number;
  createdAt: string;
}

export interface LettersResponse {
  letters: Letter[];
  nextCursor: number | null;
  hasMore: boolean;
}

export interface FavoriteResponse {
  favorited: boolean;
  favoritesCount: number;
}

export const TAGS = [
  '古风',
  '现代诗',
  '故事',
  '情感',
  '哲理',
  '科幻',
  '童话',
  '游记',
  '随笔',
  '对话',
  '短句',
  '幽默',
] as const;

export type TagType = (typeof TAGS)[number];

export const FONTS = ['楷体', '宋体', '仿宋'] as const;
export type FontType = (typeof FONTS)[number];
