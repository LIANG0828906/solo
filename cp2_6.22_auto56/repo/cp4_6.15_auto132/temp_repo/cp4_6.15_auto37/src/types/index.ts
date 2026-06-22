export interface Stall {
  id: string;
  name: string;
  description: string;
  backgroundColor: string;
  area: string;
  createdAt: number;
}

export type ProductCategory = 'clothing' | 'handmade' | 'books' | 'electronics' | 'other';

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  clothing: '服饰',
  handmade: '手工',
  books: '书籍',
  electronics: '电器',
  other: '其他',
};

export const AREA_OPTIONS = ['A区', 'B区', 'C区', 'D区', 'E区'];

export interface Product {
  id: string;
  stallId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  description: string;
  category: ProductCategory;
  createdAt: number;
}

export type TransactionStatus = 'completed' | 'cancelled';

export interface Transaction {
  id: string;
  productId: string;
  productName: string;
  stallId: string;
  stallName: string;
  buyerNickname: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: TransactionStatus;
  createdAt: number;
  cancelledAt?: number;
}

export interface Favorite {
  id: string;
  productId: string;
  createdAt: number;
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface Filters {
  category: ProductCategory | 'all';
  area: string;
  priceRange: PriceRange;
}
