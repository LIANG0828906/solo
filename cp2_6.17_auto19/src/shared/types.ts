export enum OrderStatus {
  PENDING = 'pending',
  COOKING = 'cooking',
  COMPLETED = 'completed'
}

export type Category = 'burger' | 'snack' | 'drink' | 'all';

export interface MenuItem {
  id: string;
  name: string;
  category: 'burger' | 'snack' | 'drink';
  price: number;
  emoji: string;
  stock: number;
  enabled: boolean;
  description?: string;
}

export interface CartItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  emoji: string;
}

export interface Order {
  id: string;
  orderNo: string;
  createdAt: number;
  totalAmount: number;
  status: OrderStatus;
  estimatedTime: number;
  items: CartItem[];
}

export type Role = 'customer' | 'chef' | 'manager';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
