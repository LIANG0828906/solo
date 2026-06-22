export interface SeedItem {
  id: string;
  ownerNickname: string;
  seedName: string;
  variety: string;
  quantity: number;
  expectedExchange: string;
  photoUrl: string;
  location: string;
  createdAt: number;
}

export interface ExchangeRequest {
  id: string;
  fromUser: string;
  toUser: string;
  seedItemId: string;
  seedItem: SeedItem;
  exchangeQuantity: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'rejected';
  createdAt: number;
  updatedAt: number;
}

export interface User {
  nickname: string;
  createdAt: number;
}

export interface Stats {
  todayNewItems: number;
  todaySuccessfulExchanges: number;
  totalItems: number;
}

export type RequestStatus = 'pending' | 'confirmed' | 'cancelled' | 'rejected';
