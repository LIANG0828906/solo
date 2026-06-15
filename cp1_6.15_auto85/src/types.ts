export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  createdAt: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  createdAt: number;
}

export type PanelId = 'products' | 'orders' | 'inventory';

export interface QuoteItem extends OrderItem {}
