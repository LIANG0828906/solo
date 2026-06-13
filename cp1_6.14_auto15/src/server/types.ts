export interface User {
  id: string;
  username: string;
  passwordHash: string;
  nickname: string;
  avatar?: string;
  createdAt: string;
}

export type InstrumentCategory = 'guitar' | 'keyboard' | 'wind' | 'string' | 'percussion' | 'other';

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
  status: 'available' | 'rented';
  createdAt: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'rejected';

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
}

export interface Database {
  users: User[];
  instruments: Instrument[];
  orders: Order[];
}

export type SessionUser = { id: string; username: string; nickname: string };

declare module 'express-session' {
  interface SessionData {
    user?: SessionUser;
  }
}
