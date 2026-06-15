export type FlowerCategory = 'rose' | 'lily' | 'tulip' | 'mixed';

export type DeliveryDate = 'today' | 'tomorrow';

export type DeliveryTimeSlot = '9-12' | '14-18';

export type OrderStatus = 'pending' | 'confirmed' | 'delivered';

export interface Flower {
  id: string;
  name: string;
  category: FlowerCategory;
  price: number;
  stock: number;
  image: string;
  description: string;
}

export interface BouquetItem {
  flowerId: string;
  quantity: number;
  flower: Flower;
}

export interface Bouquet {
  id: string;
  items: BouquetItem[];
  totalPrice: number;
}

export interface DeliveryInfo {
  address: string;
  date: DeliveryDate;
  timeSlot: DeliveryTimeSlot;
  notes: string;
}

export interface Order {
  id: string;
  bouquet: Bouquet;
  deliveryInfo: DeliveryInfo;
  status: OrderStatus;
  createdAt: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}
