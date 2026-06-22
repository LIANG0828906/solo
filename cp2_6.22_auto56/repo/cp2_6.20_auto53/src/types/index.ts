export type Category = 'antique' | 'art' | 'electronics';

export const CategoryLabel: Record<Category, string> = {
  antique: '古董',
  art: '艺术品',
  electronics: '电子产品',
};

export interface AuctionItem {
  id: string;
  name: string;
  description: string;
  category: Category;
  thumbnail: string;
  image: string;
  currentPrice: number;
  startPrice: number;
  bidCount: number;
  endTime: string;
  highestBidder: string;
}

export interface BidRecord {
  id: string;
  itemId: string;
  itemName: string;
  amount: number;
  time: string;
  status: 'leading' | 'outbid';
}

export interface FavoriteItem {
  id: string;
  itemId: string;
  order: number;
  addedAt: string;
}

export interface FilterState {
  category: Category | 'all';
  minPrice: number;
  maxPrice: number;
}

export const STATUS_LABEL = {
  leading: '领先中',
  outbid: '已出局',
} as const;
