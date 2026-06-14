export type Category = 'electronics' | 'books' | 'home' | 'clothing' | 'sports' | 'other';

export type ProductStatus = 'published' | 'sold' | 'offline';

export type RequestStatus = 'pending' | 'accepted' | 'rejected';

export type RouteName = 'browse' | 'publish' | 'detail' | 'profile';

export interface RouteState {
  name: RouteName;
  params?: Record<string, string>;
}

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

export interface AppState {
  products: Product[];
  requests: ExchangeRequest[];
  currentUserId: string;
  route: RouteState;
}

export type AppAction =
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: { id: string; updates: Partial<Product> } }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'SET_REQUESTS'; payload: ExchangeRequest[] }
  | { type: 'ADD_REQUEST'; payload: ExchangeRequest }
  | { type: 'UPDATE_REQUEST'; payload: { id: string; updates: Partial<ExchangeRequest> } }
  | { type: 'NAVIGATE'; payload: RouteState };

export const CATEGORY_LABELS: Record<Category, string> = {
  electronics: '电子产品',
  books: '书籍',
  home: '家居',
  clothing: '服饰',
  sports: '运动',
  other: '其他',
};
