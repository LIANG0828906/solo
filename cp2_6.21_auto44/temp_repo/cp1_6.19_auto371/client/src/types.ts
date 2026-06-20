export interface Bouquet {
  id: string;
  name: string;
  price: number;
  emoji: string;
  color: string;
  description: string;
  meaning: string;
  pairing: string;
}

export interface CartItem {
  bouquet: Bouquet;
  quantity: number;
}

export interface OrderItem {
  bouquetId: string;
  bouquetName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  recipientName: string;
  phone: string;
  address: string;
  lat: number;
  lng: number;
  timeSlot: string;
  status: 'pending' | 'delivering' | 'completed';
  createdAt: string;
}

export interface RouteStop {
  orderId: string;
  address: string;
  lat: number;
  lng: number;
  sequence: number;
  distanceFromPrev: number;
}
