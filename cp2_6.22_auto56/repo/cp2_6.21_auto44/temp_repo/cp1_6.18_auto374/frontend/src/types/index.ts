export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  cover?: string;
  description?: string;
  totalPages?: number;
  currentPage?: number;
  progress: number;
  addedAt: string;
  userId: string;
}

export interface Review {
  id: string;
  bookId: string;
  userId: string;
  username: string;
  userAvatar?: string;
  content: string;
  rating?: number;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location?: string;
  status: 'upcoming' | 'ongoing' | 'ended';
  participants: string[];
  participantCount: number;
  maxParticipants?: number;
  createdAt: string;
  creatorId: string;
}

export interface CommunityPost {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  content: string;
  images?: string[];
  likes: number;
  comments: number;
  createdAt: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AddBookData {
  isbn?: string;
  title?: string;
  author?: string;
  description?: string;
  cover?: string;
  totalPages?: number;
}

export interface AddReviewData {
  bookId: string;
  content: string;
  rating?: number;
}

export interface CreateEventData {
  title: string;
  description: string;
  date: string;
  location?: string;
  maxParticipants?: number;
}

export interface UpdateProgressData {
  bookId: string;
  progress: number;
  currentPage?: number;
}
