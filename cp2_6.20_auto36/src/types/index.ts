export interface User {
  id: string;
  name: string;
  avatar: string;
}

export type AuctionStatus = 'upcoming' | 'ongoing' | 'ended';

export interface Bid {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  amount: number;
  time: Date;
}

export interface AuctionItem {
  id: string;
  name: string;
  description: string;
  image: string;
  startingPrice: number;
  currentPrice: number;
  bidCount: number;
  bids: Bid[];
  auctionId: string;
}

export interface Auction {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  endTime: Date;
  items: AuctionItem[];
  status: AuctionStatus;
}
