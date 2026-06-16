export type ItemCategory = '布料' | '线材' | '纸张' | '木材' | '金属' | '皮革' | '其他';

export type ItemStatus = 'available' | 'exchanged' | 'pending';

export type RequestStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled';

export interface User {
  id: string;
  name: string;
  avatar: string;
  ecoPoints: number;
  createdAt: number;
  isAdmin: boolean;
}

export interface Item {
  id: string;
  ownerId: string;
  name: string;
  category: ItemCategory;
  description: string;
  wearLevel: number;
  desiredExchange: string;
  status: ItemStatus;
  createdAt: number;
  imageUrl: string;
}

export interface ExchangeRequest {
  id: string;
  requesterId: string;
  responderId: string;
  offeredItemId: string;
  requestedItemId: string;
  status: RequestStatus;
  createdAt: number;
  updatedAt: number;
}

export interface ExchangeLog {
  id: string;
  requestId: string;
  user1Id: string;
  user2Id: string;
  item1Id: string;
  item2Id: string;
  pointsEarned: number;
  completedAt: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
