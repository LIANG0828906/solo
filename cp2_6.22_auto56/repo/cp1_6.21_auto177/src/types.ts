export interface AuctionItem {
  id: string;
  name: string;
  startPrice: number;
  description: string;
  image: string;
  sold: boolean;
  currentPrice: number;
}

export interface BidRecord {
  id: string;
  itemId: string;
  amount: number;
  userId: string;
  userName: string;
  userAvatar: string;
  createdAt: string;
}

export interface AuctionContextType {
  items: AuctionItem[];
  setItems: React.Dispatch<React.SetStateAction<AuctionItem[]>>;
  selectedItemId: string | null;
  setSelectedItemId: React.Dispatch<React.SetStateAction<string | null>>;
  bids: BidRecord[];
  setBids: React.Dispatch<React.SetStateAction<BidRecord[]>>;
  auctionActive: boolean;
  setAuctionActive: React.Dispatch<React.SetStateAction<boolean>>;
  currentView: 'auction' | 'admin';
  setCurrentView: React.Dispatch<React.SetStateAction<'auction' | 'admin'>>;
  soldItems: AuctionItem[];
  setSoldItems: React.Dispatch<React.SetStateAction<AuctionItem[]>>;
}
