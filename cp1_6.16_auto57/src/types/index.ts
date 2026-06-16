export interface User {
  id: string;
  username: string;
  avatarColor: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  ownerId: string;
  isAvailable: boolean;
  createdAt: Date;
}

export interface SwapRequest {
  id: string;
  requesterId: string;
  recipientId: string;
  requestedBookId: string;
  offeredBookId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

export interface SwapHistory {
  id: string;
  requestId: string;
  user1Id: string;
  user2Id: string;
  book1Id: string;
  book2Id: string;
  status: 'completed' | 'cancelled';
  completedAt: Date;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export type BookCategory = '科幻' | '文学' | '历史' | '科技' | '艺术' | '其他';

export const CATEGORIES: BookCategory[] = ['科幻', '文学', '历史', '科技', '艺术', '其他'];
