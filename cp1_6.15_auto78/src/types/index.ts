export interface MenuItem {
  id: string;
  name: string;
  category: 'iced' | 'hot' | 'light';
  price: number;
  image_url: string;
  description?: string;
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export type OrderStatus = 'submitted' | 'preparing' | 'ready' | 'completed';

export interface Order {
  id: string;
  status: OrderStatus;
  items: OrderItem[];
  pickupTime: string;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  items: OrderItem[];
  pickupTime: string;
  total: number;
}
