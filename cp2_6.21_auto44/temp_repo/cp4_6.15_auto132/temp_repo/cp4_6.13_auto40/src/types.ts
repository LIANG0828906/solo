export interface AuctionItem {
  id: string;
  name: string;
  startPrice: number;
  imageUrl: string;
}

export interface BidRecord {
  id: string;
  userId: string;
  nickname: string;
  avatar: string;
  amount: number;
  timestamp: number;
}

export interface User {
  id: string;
  nickname: string;
  avatar: string;
}

export interface RoomState {
  roomId: string;
  currentItem: AuctionItem | null;
  itemQueue: AuctionItem[];
  bidHistory: BidRecord[];
  highestBid: number;
  highestBidder: string;
  highestBidderNickname: string;
  countdown: number;
  status: 'waiting' | 'bidding' | 'ended';
  users: User[];
}

export type WSMessageType =
  | 'JOIN_ROOM'
  | 'ROOM_STATE'
  | 'PLACE_BID'
  | 'NEW_BID'
  | 'ITEM_CHANGED'
  | 'AUCTION_ENDED'
  | 'UPLOAD_ITEM';

export interface WSMessage<T = unknown> {
  type: WSMessageType;
  payload: T;
}

export interface JoinRoomPayload {
  roomId: string;
  user: User;
}

export interface PlaceBidPayload {
  roomId: string;
  userId: string;
  amount: number;
}

export interface NewBidPayload {
  bid: BidRecord;
  countdown: number;
  highestBid: number;
  highestBidder: string;
  highestBidderNickname: string;
}

export interface ItemChangedPayload {
  item: AuctionItem;
  countdown: number;
  bidHistory: BidRecord[];
}

export interface UploadItemPayload {
  roomId: string;
  item: AuctionItem;
}
