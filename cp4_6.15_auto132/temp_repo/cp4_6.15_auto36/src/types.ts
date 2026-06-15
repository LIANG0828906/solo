export interface User {
  id: string;
  nickname: string;
  avatar: string;
  community: string;
  addressRange: string;
  skillTags: string[];
}

export interface Item {
  id: string;
  userId: string;
  title: string;
  description: string;
  images: string[];
  condition: number;
  categories: string[];
  createdAt: number;
  status: 'active' | 'exchanged' | 'expired';
}

export interface ExchangeRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  itemId: string;
  status: 'pending' | 'confirmed' | 'completed' | 'rejected';
  createdAt: number;
}

export interface Comment {
  id: string;
  itemId: string;
  userId: string;
  content: string;
  createdAt: number;
}

export type ItemCategory = '书籍' | '家居' | '电子' | '玩具' | '运动' | '其他';

export const CATEGORIES: ItemCategory[] = ['书籍', '家居', '电子', '玩具', '运动', '其他'];

export const EXPIRE_DAYS = 30;
