export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  avatar: string;
}

export interface Book {
  id: string;
  ownerId: string;
  title: string;
  author: string;
  category: string;
  coverUrl: string;
  condition: string;
  description: string;
  createdAt: string;
  status: string;
}

export interface Exchange {
  id: string;
  requesterId: string;
  targetBookId: string;
  ownerId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  userId: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  relatedExchangeId: string;
}
