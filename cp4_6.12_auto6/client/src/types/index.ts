export type Category = '文学' | '历史' | '科技' | '艺术' | '生活';

export interface Book {
  id: number;
  title: string;
  author: string;
  category: Category;
  publishYear: number;
  publisher: string;
  isbn: string;
  condition: number;
  conditionDesc: string;
  price: number;
  stock: number;
  circulationCount: number;
  sales: number;
  coverGradient: string;
  status: 'on' | 'off';
  createdAt: string;
}

export interface Review {
  id: number;
  bookId: number;
  userName: string;
  rating: number;
  content: string;
  images: string[];
  createdAt: string;
}

export interface SearchResult {
  data: Book[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Stats {
  totalStock: number;
  pendingOrders: number;
  visits7d: number;
  sales7d: { date: string; count: number }[];
}

export interface PriceSuggestion {
  suggestedPrice: number;
  basePrice: number;
  conditionMultiplier: number;
  yearDepreciation: number;
}

export const CATEGORY_GRADIENTS: Record<Category, string> = {
  '文学': 'linear-gradient(135deg, #8B4513, #A0522D)',
  '历史': 'linear-gradient(135deg, #1E3A5F, #2E5077)',
  '科技': 'linear-gradient(135deg, #0D7377, #14A7A0)',
  '艺术': 'linear-gradient(135deg, #6B4E71, #8B5F8F)',
  '生活': 'linear-gradient(135deg, #2D5A27, #3D7A37)',
};

export const CATEGORIES: Category[] = ['文学', '历史', '科技', '艺术', '生活'];
