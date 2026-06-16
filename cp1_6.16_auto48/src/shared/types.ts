export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  price: number;
  stock: number;
  coverUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'completed' | 'cancelled';

export interface OrderItem {
  bookId: string;
  title: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  bookId: string;
  title: string;
  price: number;
  quantity: number;
  stock: number;
}

export type SSEEventType = 'inventory_update' | 'order_update';

export interface SSEEvent {
  type: SSEEventType;
  timestamp: number;
  data: Book | Order | Book[] | Order[];
}

export interface StatsData {
  orderTrend: { date: string; count: number }[];
  priceDistribution: { range: string; count: number }[];
  topStockBooks: { title: string; stock: number }[];
}
