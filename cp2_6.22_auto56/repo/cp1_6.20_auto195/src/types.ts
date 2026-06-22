export interface User {
  id: string;
  nickname: string;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  recommendation?: string;
  emoji?: string;
  cover?: string;
  description?: string;
}

export interface Box {
  id: string;
  name: string;
  book: Book;
  ownerId: string;
  ownerNickname: string;
  createdAt: string;
  isFished: boolean;
  fishedBy?: string;
  fishedAt?: string;
}

export interface Fishing {
  id: string;
  userId: string;
  userNickname: string;
  boxId: string;
  book: Book;
  boxName: string;
  ownerNickname: string;
  fishedAt: string;
}

export interface Recommendation {
  id: string;
  userId: string;
  userNickname: string;
  boxId: string;
  book: Book;
  boxName: string;
  matchRate: number;
  recommendedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
