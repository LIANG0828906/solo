export interface User {
  id: string;
  nickname: string;
  avatar?: string;
}

export interface Bid {
  id: string;
  artworkId: string;
  userId: string;
  userNickname: string;
  amount: number;
  timestamp: number;
}

export interface Artwork {
  id: string;
  title: string;
  artist: string;
  description: string;
  imageUrl: string;
  startingPrice: number;
  currentPrice: number;
  endTime: number;
  isEnded: boolean;
  winnerId?: string;
  winnerNickname?: string;
}
