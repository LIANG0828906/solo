export type OrderStatus = 'pending' | 'confirmed' | 'delivering' | 'delivered' | 'completed';

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  dailyLimit: number;
  sold: number;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userName: string;
  userAvatar: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  deliveryLocation: { x: number; y: number };
}

export interface DeliveryRoute {
  orderId: string;
  path: { x: number; y: number }[];
  currentIndex: number;
  progress: number;
}

export interface Statistics {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  deliveredOrders: number;
  yesterdayOrders: number;
  yesterdayRevenue: number;
}

export interface AppState {
  products: Product[];
  orders: Order[];
  deliveryRoutes: DeliveryRoute[];
  statistics: Statistics;
  addProduct: (product: Omit<Product, 'id' | 'sold' | 'createdAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  updateDeliveryLocation: (orderId: string, location: { x: number; y: number }) => void;
  calculateStatistics: () => void;
  initializeMockData: () => void;
  createQuickOrder: (productId: string, quantity: number) => boolean;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '待处理',
  confirmed: '已确认',
  delivering: '配送中',
  delivered: '已送达',
  completed: '已完成',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#6B7280',
  confirmed: '#3B82F6',
  delivering: '#F97316',
  delivered: '#10B981',
  completed: '#8B5CF6',
};

export const STATUS_TRANSITION: Record<OrderStatus, OrderStatus | null> = {
  pending: 'confirmed',
  confirmed: 'delivering',
  delivering: 'delivered',
  delivered: 'completed',
  completed: null,
};
