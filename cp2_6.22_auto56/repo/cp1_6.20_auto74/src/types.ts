export type MenuItemType = 'drink' | 'dessert';
export type DrinkCategory = 'coffee' | 'tea' | 'special';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  type: MenuItemType;
  available: boolean;
  category?: DrinkCategory;
  hasGluten?: boolean;
}

export type OrderStatus = 'pending' | 'making' | 'completed';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  tableNumber: number;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
}

export interface Notification {
  id: string;
  message: string;
}
