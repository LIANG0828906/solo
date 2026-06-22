export type ItemCategory = '书籍' | '电子' | '家居' | '服饰' | '运动' | '其他';

export type ItemStatus = 'available' | 'reserved' | 'exchanged';

export interface Item {
  id: string;
  name: string;
  category: ItemCategory;
  weight: number;
  description: string;
  imageUrl: string;
  distance: number;
  status: ItemStatus;
  publisherId: string;
  publisherName: string;
  publishTime: Date;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  carbonPoints: number;
  exchangeCount: number;
  totalReduction: number;
  monthlyExchangeCount: number;
  pointsHistory: number[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  itemId: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: Date;
}

export interface CarbonResult {
  reduction: number;
  carbonPoints: number;
  category: string;
  weight: number;
}

export type DistanceFilter = 'all' | '1km' | '3km' | '5km';
