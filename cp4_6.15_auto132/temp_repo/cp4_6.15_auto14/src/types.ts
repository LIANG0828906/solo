export interface Order {
  id: string;
  customerName: string;
  phone: string;
  community: string;
  productName: string;
  quantity: number;
  createdAt: number;
}

export interface CustomerDetail {
  customerName: string;
  phone: string;
  quantity: number;
}

export interface ProductSummary {
  productName: string;
  totalQuantity: number;
  customers: CustomerDetail[];
}

export interface CommunityGroup {
  community: string;
  products: ProductSummary[];
  orders: Order[];
}

export interface CommunityLocation {
  community: string;
  x: number;
  y: number;
}

export interface DeliveryRoute {
  order: CommunityLocation[];
  totalDistance: number;
}

export interface NotificationItem {
  id: string;
  community: string;
  customerName: string;
  phone: string;
  message: string;
  sentAt: number;
}

export interface FormData {
  customerName: string;
  phone: string;
  community: string;
  productName: string;
  quantity: string;
}

export interface FormErrors {
  customerName?: string;
  phone?: string;
  community?: string;
  productName?: string;
  quantity?: string;
}
