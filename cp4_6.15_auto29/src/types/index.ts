export type Category = 'electronics' | 'books' | 'home' | 'clothing' | 'sports' | 'other';

export type ProductStatus = 'published' | 'sold' | 'offline';

export type RequestStatus = 'pending' | 'accepted' | 'rejected';

export interface Product {
  id: string;
  title: string;
  category: Category;
  condition: number;
  description: string;
  images: string[];
  exchangePreference: string;
  status: ProductStatus;
  ownerId: string;
  createdAt: number;
}

export interface ExchangeRequest {
  id: string;
  productId: string;
  offerDescription: string;
  contactInfo: string;
  requesterId: string;
  status: RequestStatus;
  isRead: boolean;
  createdAt: number;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  electronics: '电子产品',
  books: '书籍',
  home: '家居',
  clothing: '服饰',
  sports: '运动',
  other: '其他',
};
