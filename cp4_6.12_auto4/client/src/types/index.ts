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

export interface StatusHistoryItem {
  status: OrderStatus;
  operator: string;
  timestamp: string;
}

export interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  customerEmail: string;
  configuration: Configuration;
  configSummary: string;
  totalAmount: number;
  status: OrderStatus;
  statusHistory: StatusHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface InventoryAlert {
  leatherId: string;
  leatherName: string;
  currentStock: number;
  minStock: number;
}

export type NotificationType = 'order_confirm' | 'status_update';

export interface Notification {
  id: string;
  orderId: string;
  recipient: string;
  type: NotificationType;
  subject: string;
  content: string;
  sentAt: string;
}
