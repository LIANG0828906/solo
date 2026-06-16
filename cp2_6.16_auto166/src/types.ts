export type ItemCategory = 'book' | 'digital' | 'appliance' | 'other';
export type ItemStatus = 'available' | 'exchanging' | 'exchanged';
export type ExchangeStatus = 'pending' | 'accepted' | 'rejected';
export type CalendarEventType = 'publish' | 'exchange' | 'return' | 'memo';

export interface Item {
  id: string;
  name: string;
  photo: string;
  estimatedValue: number;
  condition: number;
  category: ItemCategory;
  notes: string;
  status: ItemStatus;
  userId: string;
  isPublished: boolean;
  createdAt: number;
}

export interface ExchangeRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  offeredItemId: string;
  requestedItemId: string;
  message: string;
  status: ExchangeStatus;
  createdAt: number;
}

export interface Message {
  id: string;
  exchangeId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: number;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  itemId?: string;
  type: CalendarEventType;
  title: string;
  date: number;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  points: number;
  exchangeCount: number;
}
