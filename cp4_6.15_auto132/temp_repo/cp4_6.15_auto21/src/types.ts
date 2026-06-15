export type BookCategory = '文学' | '科技' | '生活' | '教育';

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  price: number;
  stock: number;
  category: BookCategory;
  coverColor: string;
  createdAt: number;
}

export type OrderStatus = '待支付' | '已支付' | '已发货' | '已完成' | '已取消';

export interface OrderItem {
  bookId: string;
  bookTitle: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  promoCode?: string;
  status: OrderStatus;
  createdAt: number;
}

export interface Promotion {
  id: string;
  code: string;
  minAmount: number;
  discountAmount: number;
  maxUsage: number;
  usedCount: number;
  expiresAt: number;
  createdAt: number;
}

export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalInventoryValue: number;
  salesLast7Days: { date: string; amount: number }[];
}

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export type TabType = 'dashboard' | 'books' | 'orders' | 'promotions';
