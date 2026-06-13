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

export type InstrumentStatus = 'available' | 'rented' | 'pending';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export const INSTRUMENT_STATUS_LABELS: Record<InstrumentStatus, string> = {
  available: '可租',
  rented: '已租出',
  pending: '待确认',
};

export const CATEGORY_LABELS: Record<InstrumentCategory, string> = {
  guitar: '吉他',
  keyboard: '键盘',
  wind: '管乐',
  string: '弦乐',
  percussion: '打击乐',
  other: '其他',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  active: '进行中',
  completed: '已完成',
  cancelled: '已取消',
  rejected: '已拒绝',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-orange-500',
  confirmed: 'bg-blue-500',
  active: 'bg-green-500',
  completed: 'bg-gray-500',
  cancelled: 'bg-gray-400',
  rejected: 'bg-red-500',
};

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

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  nickname: string;
  avatar?: string;
  createdAt: string;
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
