export interface Product {
  id: string;
  name: string;
  startingPrice: number;
}

export interface Bid {
  id: string;
  productId: string;
  bidder: string;
  bidderColor: string;
  amount: number;
  timestamp: number;
}
