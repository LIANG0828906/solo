export interface User {
  id: number;
  email: string;
  username: string;
}

export interface Club {
  id: number;
  name: string;
  description: string;
  coverImageUrl: string;
  creatorId: number;
  createdAt: string;
  currentBook?: Book;
  currentStage?: Stage;
  daysRemaining?: number;
}

export interface Book {
  id: number;
  clubId: number;
  title: string;
  author: string;
  coverImageUrl: string;
  createdAt: string;
  stages: Stage[];
}

export interface Stage {
  id: number;
  bookId: number;
  name: string;
  startPage: number;
  endPage: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  hasEnded: boolean;
}

export interface Note {
  id: number;
  stageId: number;
  userId: number;
  username: string;
  text: string;
  imageUrls: string[];
  likes: number;
  isLikedByMe: boolean;
  createdAt: string;
}

export interface Message {
  id: number;
  stageId: number;
  userId: number;
  username: string;
  content: string;
  mentions: number[];
  createdAt: string;
}

export interface ClubWithStats extends Club {
  noteSubmitRate: number;
}

export interface CreateNoteRequest {
  stageId: number;
  text: string;
  imageUrls: string[];
}

export interface CreateMessageRequest {
  stageId: number;
  content: string;
  mentions: number[];
}

export interface CreateClubRequest {
  name: string;
  description: string;
  coverImage?: File;
}

export interface CreateBookRequest {
  clubId: number;
  title: string;
  author: string;
  coverImage?: File;
  stages: {
    name: string;
    startPage: number;
    endPage: number;
    startDate: string;
    endDate: string;
  }[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
