export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  price: number;
  stock: number;
  category: string;
  coverUrl: string;
  createdAt: string;
}

export interface CartItem {
  bookId: string;
  book: Book;
  quantity: number;
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed';

export interface Order {
  id: string;
  orderNo: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  createdAt: string;
}

export interface OrderCreateRequest {
  items: { bookId: string; quantity: number }[];
  customerName: string;
  customerPhone: string;
  customerAddress: string;
}

export interface PriceRange {
  label: string;
  min: number;
  max: number | null;
}

export interface Category {
  label: string;
  value: string;
}

export const PRICE_RANGES: PriceRange[] = [
  { label: '0-50', min: 0, max: 50 },
  { label: '50-100', min: 50, max: 100 },
  { label: '100以上', min: 100, max: null },
];

export const CATEGORIES: Category[] = [
  { label: '小说/文学', value: 'novel' },
  { label: '科技/科普', value: 'tech' },
  { label: '生活/艺术', value: 'life' },
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '待付款',
  paid: '已付款',
  shipped: '已发货',
  completed: '已完成',
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-gray-500',
  paid: 'bg-blue-500',
  shipped: 'bg-orange-500',
  completed: 'bg-green-500',
};
