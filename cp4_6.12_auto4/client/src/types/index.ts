export interface Product {
  id: string;
  name: string;
  category: 'wallet' | 'bracelet' | 'cardholder';
  basePrice: number;
  modelPath: string;
}

export interface Leather {
  id: string;
  name: string;
  type: 'cowhide' | 'sheepskin' | 'vegetable';
  color: string;
  colorName: string;
  texturePreview: string;
  priceAdd: number;
  stock: number;
  minStock: number;
}

export interface ThreadColor {
  id: string;
  name: string;
  color: string;
}

export interface Hardware {
  id: string;
  name: string;
  type: 'zipper' | 'buckle';
  color: string;
  priceAdd: number;
}

export interface Configuration {
  productId: string;
  leatherId: string;
  threadColorId: string;
  hardwareId: string;
  engraving: string;
}

export type OrderStatus = 'pending' | 'producing' | 'inspecting' | 'shipped' | 'completed';

export interface StatusHistoryEntry {
  status: string;
  operator: string;
  timestamp: string;
}

export interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  customerEmail: string;
  productId: string;
  leatherId: string;
  threadColorId: string;
  hardwareId: string;
  engraving: string;
  configSummary: string;
  totalAmount: number;
  status: OrderStatus;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface InventoryAlert {
  leatherId: string;
  leatherName: string;
  currentStock: number;
  minStock: number;
}

export interface Notification {
  id: string;
  orderId: string;
  recipient: string;
  type: 'order_confirm' | 'status_update';
  subject: string;
  content: string;
  sentAt: string;
}

export const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: '待确认', color: '#FF9800' },
  producing: { label: '生产中', color: '#2196F3' },
  inspecting: { label: '质检中', color: '#9C27B0' },
  shipped: { label: '已发货', color: '#4CAF50' },
  completed: { label: '已完成', color: '#9E9E9E' },
};

export const LEATHER_TYPE_LABELS: Record<string, string> = {
  cowhide: '头层牛皮',
  sheepskin: '羊皮',
  vegetable: '植鞣革',
};
