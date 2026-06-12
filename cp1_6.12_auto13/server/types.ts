export interface Bidder {
  id: string;
  name: string;
  avatar: string;
  isUser?: boolean;
}

export interface Bid {
  id: string;
  auctionId: string;
  bidder: Bidder;
  amount: number;
  timestamp: number;
}

export interface Auction {
  id: string;
  name: string;
  image: string;
  startPrice: number;
  currentPrice: number;
  remainingTime: number;
  status: 'active' | 'ended';
  winner?: Bidder;
  bids: Bid[];
}

export interface DealRecord {
  id: string;
  auctionId: string;
  auctionName: string;
  winner: Bidder;
  price: number;
  timestamp: number;
}

export type ClientToServerEvents = {
  joinRoom: (data: { auctionId: string }) => void;
  leaveRoom: (data: { auctionId: string }) => void;
  bid: (data: {
    auctionId: string;
    amount: number;
    bidderId: string;
    bidderName: string;
  }) => void;
};

export type ServerToClientEvents = {
  auctionList: (auctions: Auction[]) => void;
  priceUpdate: (data: { auctionId: string; currentPrice: number; lastBid: Bid }) => void;
  bidHistory: (data: { auctionId: string; bids: Bid[] }) => void;
  countdownUpdate: (data: { auctionId: string; remaining: number }) => void;
  auctionEnd: (data: { auctionId: string; winner: Bidder; finalPrice: number }) => void;
  newDealRecord: (record: DealRecord) => void;
  bidSuccess: (data: { auctionId: string }) => void;
};
