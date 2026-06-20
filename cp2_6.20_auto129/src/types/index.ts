export interface User {
  id: string;
  nickname: string;
  avatar: string;
}

export interface Book {
  isbn: string;
  title: string;
  author: string;
  cover: string;
}

export interface Review {
  id: string;
  userId: string;
  user?: User;
  bookIsbn: string;
  book?: Book;
  content: string;
  tags: string[];
  likes: number;
  isLiked: boolean;
  comments: number;
  createdAt: string;
}

export interface Debate {
  id: string;
  title: string;
  initiatorId: string;
  initiator?: User;
  reviewId: string;
  participantCount: number;
  lastReplyAt: string;
  proMessages: DebateMessage[];
  conMessages: DebateMessage[];
}

export interface DebateMessage {
  id: string;
  debateId: string;
  userId: string;
  user?: User;
  side: 'pro' | 'con';
  content: string;
  createdAt: string;
}

export interface BookshelfItem {
  id: string;
  book: Book;
  progress: number;
  addedAt: string;
}

export interface Note {
  id: string;
  bookIsbn: string;
  content: string;
  page?: number;
  createdAt: string;
}
