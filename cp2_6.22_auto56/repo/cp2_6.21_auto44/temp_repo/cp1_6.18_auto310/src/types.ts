export type ProductType = '饰品' | '陶瓷' | '木工' | '织物';
export type OrderStatus = '待确认' | '设计中' | '制作中' | '待发货' | '已完成';

export interface LogEntry {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
}

export interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  phone: string;
  productType: ProductType;
  description: string;
  referenceImages: string[];
  designImages: string[];
  finalImages: string[];
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  logs: LogEntry[];
}

export interface CreateOrderRequest {
  customerName: string;
  phone: string;
  productType: ProductType;
  description: string;
  referenceImages: string[];
}

export const STATUS_COLORS: Record<OrderStatus, string> = {
  '待确认': '#FF9800',
  '设计中': '#2196F3',
  '制作中': '#4CAF50',
  '待发货': '#9C27B0',
  '已完成': '#607D8B'
};

export const PRODUCT_ICONS: Record<ProductType, string> = {
  '饰品': 'fa-gem',
  '陶瓷': 'fa-mug-hot',
  '木工': 'fa-tree',
  '织物': 'fa-shirt'
};
