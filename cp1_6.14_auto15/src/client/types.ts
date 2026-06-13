export interface User {
  id: string;
  username: string;
  passwordHash: string;
  nickname: string;
  avatar?: string;
  createdAt: string;
}

export type SessionUser = {
  id: string;
  username: string;
  nickname: string;
  avatar?: string;
};

export type InstrumentCategory =
  | 'guitar'
  | 'keyboard'
  | 'wind'
  | 'string'
  | 'percussion'
  | 'other';

export type InstrumentStatus = 'available' | 'rented';

export interface Instrument {
  id: string;
  ownerId: string;
  name: string;
  category: InstrumentCategory;
  brand: string;
  purchaseYear: number;
  dailyRate: number;
  deposit: number;
  description: string;
  images: string[];
  status: InstrumentStatus;
  createdAt: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export interface Order {
  id: string;
  instrumentId: string;
  renterId: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalRent: number;
  deposit: number;
  status: OrderStatus;
  createdAt: string;
  instrument?: Instrument;
  renter?: SessionUser;
  owner?: SessionUser;
}

export interface GetInstrumentsParams {
  category?: InstrumentCategory;
  sort?: 'price-asc' | 'price-desc';
  search?: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  nickname: string;
}

export interface CreateOrderData {
  instrumentId: string;
  startDate: string;
  endDate: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
