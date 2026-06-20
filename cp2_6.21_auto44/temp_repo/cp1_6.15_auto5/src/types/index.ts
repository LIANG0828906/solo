export interface RecipeCard {
  id: string;
  title: string;
  coverImage: string;
  cuisine: string;
  url: string;
  order: number;
  createdAt: number;
  annotations: Annotation[];
}

export interface Annotation {
  id: string;
  content: string;
  author: string;
  avatar: string;
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
}

export type SyncEventType = 'card:add' | 'card:reorder' | 'annotation:add';

export interface SyncEvent<T = unknown> {
  type: SyncEventType;
  payload: T;
  user: User;
  timestamp: number;
}

export interface ScrapeResponse {
  success: boolean;
  data?: { title: string; coverImage: string };
  error?: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  timestamp: number;
}

export type CuisineType = '川菜' | '粤菜' | '日料' | '法餐' | '意餐' | '家常菜' | '甜点' | '其他';

export const CUISINE_TAGS: CuisineType[] = ['川菜', '粤菜', '日料', '法餐', '意餐', '家常菜', '甜点', '其他'];
