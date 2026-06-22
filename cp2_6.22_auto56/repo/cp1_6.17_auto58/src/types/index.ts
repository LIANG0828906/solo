export interface Work {
  id: string;
  title: string;
  thumbnailUrl: string;
  fullUrl: string;
  category: 'portrait' | 'landscape' | 'commercial' | 'event';
  price: number;
  description?: string;
}

export interface Booking {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  workIds: string[];
  date: string;
  notes: string;
  status: 'pending' | 'contacted' | 'confirmed';
  createdAt: string;
}

export interface BookingRequest {
  customerName: string;
  email: string;
  phone: string;
  workIds: string[];
  date: string;
  notes: string;
}

export type Category = 'all' | 'portrait' | 'landscape' | 'commercial' | 'event';

export const CategoryLabel: Record<Category, string> = {
  all: '全部',
  portrait: '人像',
  landscape: '风景',
  commercial: '商业',
  event: '活动',
};
