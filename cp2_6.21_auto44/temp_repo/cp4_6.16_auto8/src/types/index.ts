export interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  cover: string;
  description: string;
  category: '小说' | '科技' | '艺术' | '生活';
  stock: number;
  publishDate: string;
}

export interface CartItem {
  id: string;
  bookId: string;
  quantity: number;
}

export type Category = '全部' | '小说' | '科技' | '艺术' | '生活';

export type SortBy = 'default' | 'price-asc' | 'price-desc' | 'date-desc';

export interface Discount {
  code: string;
  rate: number;
  applied: boolean;
}

export const CATEGORIES: Category[] = ['全部', '小说', '科技', '艺术', '生活'];

export const VALID_DISCOUNT_CODES: Record<string, number> = {
  BOOK10: 0.9
};
