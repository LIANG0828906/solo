export interface Artwork {
  id: string;
  code: string;
  title: string;
  description: string;
  previewImage: string;
  thumbnail: string;
  startingPrice: number;
  seriesId: string;
}

export interface BoxSeries {
  id: string;
  name: string;
  description: string;
  price: number;
  totalCount: number;
  soldCount: number;
  artworks: Artwork[];
}

export interface User {
  id: string;
  name: string;
  balance: number;
  collection: string[];
}

export interface Bid {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  timestamp: number;
}

export interface Auction {
  id: string;
  artworkId: string;
  sellerId: string;
  sellerName: string;
  startingPrice: number;
  currentPrice: number;
  highestBidderId: string | null;
  highestBidderName: string | null;
  startTime: number;
  endTime: number;
  duration: 24 | 48 | 72;
  bids: Bid[];
  status: 'active' | 'ended';
}

export interface Transaction {
  id: string;
  type: 'box_purchase' | 'auction_win' | 'auction_sell';
  userId: string;
  userName: string;
  artworkId?: string;
  artworkCode?: string;
  auctionId?: string;
  amount: number;
  timestamp: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}
