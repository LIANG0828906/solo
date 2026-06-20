export interface User {
  id: string;
  name: string;
  avatar?: string;
}

export interface Comment {
  id: string;
  noteId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: number;
}

export interface LikeRecord {
  timestamp: number;
}

export interface Note {
  id: string;
  userId: string;
  userName: string;
  content: string;
  tags: string[];
  createdAt: number;
  likes: number;
  likeHistory: LikeRecord[];
  comments: Comment[];
}

export type TagColor = '#FF6B6B' | '#4ECDC4' | '#FFE66D' | '#95E1D3' | '#A8E6CF' | '#DDA0DD';

export interface TagOption {
  name: string;
  color: TagColor;
}
