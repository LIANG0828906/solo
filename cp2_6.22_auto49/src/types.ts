export interface User {
  id: string;
  username: string;
  nickname: string;
  creditScore: number;
  balance: number;
  avatar?: string;
}

export interface BidRecord {
  id: string;
  auctionId: string;
  userId: string;
  nickname: string;
  amount: number;
  timestamp: number;
}

export interface Auction {
  id: string;
  sellerId: string;
  sellerNickname: string;
  title: string;
  author: string;
  description: string;
  coverUrl: string;
  startPrice: number;
  currentPrice: number;
  durationHours: number;
  startTime: number;
  endTime: number;
  status: 'upcoming' | 'active' | 'ended';
  winnerId?: string;
  winnerNickname?: string;
  finalPrice?: number;
  bidHistory: BidRecord[];
}

export type SortOrder = 'price-asc' | 'price-desc' | 'time-asc';

export type ViewMode = 'list' | 'detail' | 'profile' | 'create';
