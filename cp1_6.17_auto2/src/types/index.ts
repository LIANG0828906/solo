export interface Gift {
  id: string;
  name: string;
  iconUrl: string;
  price: number;
  sales: number;
}

export interface Danmaku {
  id: string;
  nickname: string;
  content: string;
  timestamp: number;
  avatar: string;
}

export interface GiftRecord {
  id: string;
  nickname: string;
  giftId: string;
  giftName: string;
  giftIcon: string;
  quantity: number;
  timestamp: number;
}

export interface RankingItem {
  userId: string;
  nickname: string;
  avatar: string;
  contribution: number;
}

export type RankingPeriod = 'today' | 'week' | 'all';
